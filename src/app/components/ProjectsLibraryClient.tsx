'use client';

import Link from 'next/link';
import { useState } from 'react';
import BuilderScrollLink from './BuilderScrollLink';

interface ProjectSummary {
  id: string;
  displayName: string;
  description: string;
  userPrompt: string;
  status: string;
  totalFiles: number;
  totalSizeBytes: number;
  generationTimeMs: number;
  updatedAt: string;
  blueprint: {
    featureCount: number;
    modelCount: number;
    pageCount: number;
  } | null;
}

interface ProjectsLibraryClientProps {
  initialProjects: ProjectSummary[];
}

type FeedbackState =
  | {
      tone: 'success' | 'error';
      message: string;
    }
  | null;

export default function ProjectsLibraryClient({
  initialProjects,
}: ProjectsLibraryClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  async function handleDelete(project: ProjectSummary) {
    const confirmed = window.confirm(
      `Delete "${project.displayName}"?\n\nThis permanently removes the saved preview, generated files, blueprint snapshot, and project history for this workspace.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(project.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? 'Failed to delete project.');
      }

      setProjects((current) => current.filter((item) => item.id !== project.id));
      setFeedback({
        tone: 'success',
        message: `"${project.displayName}" was deleted.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete project.',
      });
    } finally {
      setDeletingId(null);
    }
  }

  const generatedCount = projects.filter(
    (project) => project.status === 'GENERATED'
  ).length;

  return (
    <>
      <section className="glass-panel-strong overflow-hidden rounded-[34px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Project Library
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Your generated workspaces
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Reopen any saved project to inspect its preview, files, blueprint,
              and generated database. Everything here is tied directly to your
              signed-in workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatPill label="Projects" value={String(projects.length)} />
            <StatPill label="Generated" value={String(generatedCount)} />
            <BuilderScrollLink className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
              Generate new project
            </BuilderScrollLink>
          </div>
        </div>
      </section>

      {feedback ? (
        <section
          className={`mt-6 rounded-[24px] border px-5 py-4 text-sm ${
            feedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.message}
        </section>
      ) : null}

      {projects.length === 0 ? (
        <section className="glass-panel mt-8 rounded-[32px] px-6 py-16 text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
            <ProjectsGlyph />
          </div>
          <p className="mt-6 text-2xl font-bold text-slate-950">
            No saved projects yet
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Generate your first product from the main builder and it will appear
            here automatically with preview, files, and project database access.
          </p>
          <BuilderScrollLink className="mt-8 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-600">
            Start building
          </BuilderScrollLink>
        </section>
      ) : (
        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          {projects.map((project) => {
            const isDeleting = deletingId === project.id;

            return (
              <article
                key={project.id}
                className="glass-panel rounded-[32px] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    tone={
                      project.status === 'GENERATED'
                        ? 'success'
                        : project.status === 'FAILED'
                        ? 'danger'
                        : 'default'
                    }
                  >
                    {humanize(project.status)}
                  </StatusBadge>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Updated {formatDate(project.updatedAt)}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-950">
                  {project.displayName}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                  {project.description}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Files" value={String(project.totalFiles)} />
                  <MetricCard
                    label="Size"
                    value={formatBytes(project.totalSizeBytes)}
                  />
                  <MetricCard
                    label="Time"
                    value={formatDuration(project.generationTimeMs)}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <MetaChip
                    label="Features"
                    value={String(project.blueprint?.featureCount ?? 0)}
                  />
                  <MetaChip
                    label="Models"
                    value={String(project.blueprint?.modelCount ?? 0)}
                  />
                  <MetaChip
                    label="Pages"
                    value={String(project.blueprint?.pageCount ?? 0)}
                  />
                </div>

                <div className="mt-5 rounded-[24px] bg-slate-950 px-4 py-4 text-sm text-slate-300">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Original prompt
                  </p>
                  <p className="mt-2 leading-7 text-slate-200">
                    {truncate(project.userPrompt, 190)}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Open workspace
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(project)}
                    disabled={isDeleting}
                    className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete project'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

function StatusBadge({
  children,
  tone = 'default',
}: {
  children: string;
  tone?: 'default' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
      <span className="font-semibold text-slate-900">{value}</span> {label}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
      <span className="font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>{' '}
      <span className="font-medium text-slate-700">{value}</span>
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ProjectsGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h4.379c.398 0 .779.158 1.06.439l1.622 1.622c.281.281.663.439 1.06.439H18a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25v-10.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 13.5h9M7.5 10.5h5.25" />
    </svg>
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

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}
