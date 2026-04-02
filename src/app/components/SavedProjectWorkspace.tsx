'use client';

import { useEffect, useRef, useState } from 'react';
import DownloadButton from './DownloadButton';
import PreviewPanel from './PreviewPanel';
import ProjectDatabasePanel from './ProjectDatabasePanel';

export interface SavedProjectFile {
  path: string;
  content: string;
  source: string;
}

export interface SavedProjectBlueprint {
  projectName: string;
  description: string;
  features: Array<{ name: string; description: string; priority: string }>;
  dataModels: Array<{ name: string; fields: Array<{ name: string; type: string; required: boolean; relation?: string }> }>;
  apiEndpoints: Array<{ method: string; path: string; description: string; relatedModel: string }>;
  pages: Array<{ name: string; route: string; description: string; components: string[] }>;
  techStack: { frontend: string; backend: string; database: string; auth: string };
}

interface SavedProjectWorkspaceProps {
  projectId: string;
  projectName: string;
  displayName: string;
  description: string;
  files: SavedProjectFile[];
  blueprint: SavedProjectBlueprint | null;
  stats: {
    totalFiles: number;
    totalSizeBytes: number;
    generationTimeMs: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

type PreviewStatus = 'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'unavailable';

export default function SavedProjectWorkspace({
  projectId,
  projectName,
  displayName,
  description,
  files,
  blueprint,
  stats,
  status,
  createdAt,
  updatedAt,
}: SavedProjectWorkspaceProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle');
  const teardownRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let active = true;

    async function bootPreview() {
      if (files.length === 0) {
        setPreviewStatus('unavailable');
        setLogs((current) => [...current, 'No files were stored for this project.']);
        return;
      }

      setPreviewStatus('booting');
      setLogs([
        'Loading saved project files...',
        'Booting WebContainer preview for this stored project...',
      ]);

      try {
        const { buildFileSystemTree } = await import('@/builder/file-writer');
        const { runInWebContainer } = await import('@/lib/webcontainer');

        const normalizedFiles = files.map((file) => ({
          path: file.path,
          content: file.content,
          source: normalizeSource(file.source),
        }));

        const result = await runInWebContainer(buildFileSystemTree(normalizedFiles), {
          onStatus(nextStatus) {
            if (!active) {
              return;
            }

            if (nextStatus === 'booting') setPreviewStatus('booting');
            if (nextStatus === 'installing') setPreviewStatus('installing');
            if (nextStatus === 'starting') setPreviewStatus('starting');
            if (nextStatus === 'ready') setPreviewStatus('ready');
          },
          onLog(message) {
            if (!active) {
              return;
            }

            setLogs((current) => [...current.slice(-199), message]);
          },
          onUrl(url) {
            if (!active) {
              return;
            }

            setPreviewUrl(url);
          },
          onError(message) {
            if (!active) {
              return;
            }

            setPreviewStatus('unavailable');
            setLogs((current) => [...current.slice(-199), `Preview error: ${message}`]);
          },
        });

        if (!active) {
          await result.teardown();
          return;
        }

        teardownRef.current = result.teardown;
      } catch (error) {
        if (!active) {
          return;
        }

        setPreviewStatus('unavailable');
        setLogs((current) => [
          ...current.slice(-199),
          `Preview error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ]);
      }
    }

    void bootPreview();

    return () => {
      active = false;
      if (teardownRef.current) {
        void teardownRef.current();
        teardownRef.current = null;
      }
    };
  }, [files]);

  async function handleDownload() {
    const payload = Object.fromEntries(files.map((file) => [file.path, file.content]));
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName,
        files: payload,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to prepare download.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel-strong overflow-hidden rounded-[34px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Saved Project
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              {displayName}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <MetaPill label="Status" value={humanize(status)} />
              <MetaPill label="Project ID" value={projectId} mono />
              <MetaPill label="Created" value={formatDate(createdAt)} />
              <MetaPill label="Updated" value={formatDate(updatedAt)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ProjectDatabasePanel
              projectName={projectName}
              blueprint={blueprint}
              files={files}
            />
            <DownloadButton
              onDownload={handleDownload}
              projectName={projectName}
              fileCount={files.length}
              disabled={files.length === 0}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Files" value={String(stats.totalFiles)} helper="Stored in the latest generation row" />
        <StatCard label="Bundle Size" value={formatBytes(stats.totalSizeBytes)} helper="Approximate output size" />
        <StatCard label="Generation Time" value={formatDuration(stats.generationTimeMs)} helper="Latest generation duration" />
        <StatCard label="Preview" value={previewLabel(previewStatus)} helper={previewHelper(previewStatus)} />
      </section>

      <div className="h-[760px]">
        <PreviewPanel
          url={previewUrl}
          logs={logs}
          isReady={previewStatus === 'ready' || previewStatus === 'unavailable'}
          files={files}
        />
      </div>

      {blueprint ? (
        <section className="glass-panel-strong rounded-[34px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                Blueprint Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">{blueprint.projectName}</h2>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">{blueprint.description}</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-4">
            <SummaryColumn
              title={`Features (${blueprint.features.length})`}
              items={blueprint.features.map((feature) => `${feature.name} • ${feature.priority}`)}
            />
            <SummaryColumn
              title={`Models (${blueprint.dataModels.length})`}
              items={blueprint.dataModels.map((model) => `${model.name} • ${model.fields.length} fields`)}
            />
            <SummaryColumn
              title={`Endpoints (${blueprint.apiEndpoints.length})`}
              items={blueprint.apiEndpoints.slice(0, 10).map((endpoint) => `${endpoint.method} ${endpoint.path}`)}
            />
            <SummaryColumn
              title={`Pages (${blueprint.pages.length})`}
              items={[
                ...blueprint.pages.map((page) => `${page.name} • ${page.route}`),
                `Tech: ${blueprint.techStack.frontend}`,
                `Auth: ${blueprint.techStack.auth}`,
              ]}
            />
          </div>
        </section>
      ) : (
        <section className="glass-panel rounded-[32px] border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-slate-900">No blueprint stored for this project</p>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            The files are still available, but this project does not currently have a persisted blueprint snapshot.
          </p>
        </section>
      )}
    </div>
  );
}

function normalizeSource(source: string): 'template' | 'ai' | 'hybrid' {
  if (source === 'ai' || source === 'hybrid') {
    return source;
  }

  return 'template';
}

function previewLabel(status: PreviewStatus) {
  switch (status) {
    case 'booting':
      return 'Booting';
    case 'installing':
      return 'Installing';
    case 'starting':
      return 'Starting';
    case 'ready':
      return 'Live';
    case 'unavailable':
      return 'Unavailable';
    default:
      return 'Queued';
  }
}

function previewHelper(status: PreviewStatus) {
  switch (status) {
    case 'booting':
      return 'Preparing the sandbox';
    case 'installing':
      return 'Installing dependencies';
    case 'starting':
      return 'Launching the dev server';
    case 'ready':
      return 'Interactive preview is running';
    case 'unavailable':
      return 'Files remain available below';
    default:
      return 'Preview will start automatically';
  }
}

function MetaPill({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
      <span className="font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>{' '}
      <span className={mono ? 'font-mono text-[11px] text-slate-700' : 'font-medium text-slate-700'}>
        {value}
      </span>
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="glass-panel rounded-[26px] px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function SummaryColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

function formatBytes(value: number) {
  if (!value) {
    return '0 KB';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  return `${(value / 1024).toFixed(1)} KB`;
}

function formatDuration(value: number) {
  if (!value) {
    return '0 s';
  }

  if (value < 1000) {
    return `${value} ms`;
  }

  return `${(value / 1000).toFixed(1)} s`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
