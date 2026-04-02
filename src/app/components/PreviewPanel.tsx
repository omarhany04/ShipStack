'use client';

import { useMemo, useState } from 'react';
import FileExplorer, { type FileItem } from './FileExplorer';

interface PreviewPanelProps {
  url: string | null;
  logs: string[];
  isReady: boolean;
  files?: FileItem[];
}

type Tab = 'preview' | 'code' | 'logs';
type ViewMode = 'desktop' | 'mobile';

export default function PreviewPanel({
  url,
  logs,
  isReady,
  files = [],
}: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const status = useMemo(() => {
    if (url) {
      return { label: 'Live preview', tone: 'success' as const };
    }

    if (isReady) {
      return { label: 'Preview unavailable', tone: 'warning' as const };
    }

    return { label: 'Preparing sandbox', tone: 'default' as const };
  }, [isReady, url]);

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden rounded-[30px] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-white/80 px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Project Workspace</h3>
              <p className="mt-1 text-xs text-slate-400">
                Switch between live preview, source code, and runtime logs in one shared workspace.
              </p>
            </div>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
              <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
                Preview
              </TabButton>
              <TabButton active={activeTab === 'code'} onClick={() => setActiveTab('code')}>
                Code
              </TabButton>
              <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
                Logs
              </TabButton>
            </div>

            {activeTab === 'preview' ? (
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                <DeviceButton
                  label="Desktop preview"
                  active={viewMode === 'desktop'}
                  onClick={() => setViewMode('desktop')}
                  icon={<DesktopIcon />}
                />
                <DeviceButton
                  label="Mobile preview"
                  active={viewMode === 'mobile'}
                  onClick={() => setViewMode('mobile')}
                  icon={<MobileIcon />}
                />
              </div>
            ) : null}

            {url ? (
              <>
                <IconButton
                  label="Refresh preview"
                  onClick={() => setIframeKey((value) => value + 1)}
                  icon={<RefreshIcon />}
                />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Open
                </a>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          url ? (
            <div
              className={`flex h-full w-full overflow-auto bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.08),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(241,245,249,0.82))] p-4 ${
                viewMode === 'mobile' ? 'items-center justify-center' : ''
              }`}
            >
              {viewMode === 'mobile' ? (
                <div className="flex h-full max-h-full w-full max-w-[390px] flex-col rounded-[36px] border-[10px] border-slate-950 bg-slate-950 p-[6px] shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
                  <div className="mx-auto my-1.5 h-1.5 w-20 rounded-full bg-slate-700" />
                  <div className="relative flex-1 overflow-hidden rounded-[24px] bg-white">
                    <iframe
                      key={`${iframeKey}-${viewMode}`}
                      src={url}
                      title="Generated app preview"
                      className="h-full w-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full w-full overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
                  <iframe
                    key={`${iframeKey}-${viewMode}`}
                    src={url}
                    title="Generated app preview"
                    className="h-full w-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50 px-6 text-center">
              <div className="max-w-md">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white">
                  <PreviewGlyph />
                </div>
                <p className="mt-5 text-lg font-semibold text-slate-800">
                  {isReady ? 'Preview unavailable' : 'Preparing live preview'}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {isReady
                    ? 'The preview sandbox could not start, but your generated files and download remain available.'
                    : 'The sandbox is booting, installing dependencies, and getting your generated app ready.'}
                </p>
              </div>
            </div>
          )
        ) : activeTab === 'code' ? (
          files.length > 0 ? (
            <div className="h-full bg-[linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(248,250,252,0.96))] p-4">
              <div className="h-full overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
                <FileExplorer
                  files={files}
                  embedded
                  title="Code Explorer"
                  description="Open files, inspect generated output, and stay in the same workspace."
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-50 px-6 text-center">
              <div className="max-w-md">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white">
                  <CodeGlyph />
                </div>
                <p className="mt-5 text-lg font-semibold text-slate-800">No code available yet</p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Generate or reopen a project first, then use this tab to browse the full file tree and source code.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="h-full overflow-y-auto bg-slate-950 p-4 font-mono text-xs text-slate-300">
            {logs.length === 0 ? (
              <p>No logs yet.</p>
            ) : (
              logs.map((log, index) => (
                <p key={`${index}-${log.slice(0, 24)}`} className="py-1 leading-6">
                  {log}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        active ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function DeviceButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
        active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
    </button>
  );
}

function IconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
    >
      {icon}
    </button>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: 'default' | 'success' | 'warning';
  children: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
      {children}
    </span>
  );
}

function DesktopIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
      <path d="M9 19.5h6" />
      <path d="M12 15.5v4" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 5.5h2" />
      <circle cx="12" cy="18.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.977V4.37" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9.51a9 9 0 1 0 2.13 5.32" />
    </svg>
  );
}

function PreviewGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="12" rx="2.5" />
      <path d="M9.5 19.5h5" />
    </svg>
  );
}

function CodeGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 9-4 3 4 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 9 4 3-4 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m14 5-4 14" />
    </svg>
  );
}
