'use client';

import { useState } from 'react';

interface PreviewPanelProps {
  url: string | null;
  logs: string[];
  isReady: boolean;
}

type Tab = 'preview' | 'logs';
type ViewMode = 'desktop' | 'mobile';

export default function PreviewPanel({ url, logs, isReady }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeTab === 'preview' ? 'bg-slate-900 text-white' : 'text-slate-500'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeTab === 'logs' ? 'bg-slate-900 text-white' : 'text-slate-500'
            }`}
          >
            Logs
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'preview' ? (
            <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 sm:inline-flex">
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
              <button
                type="button"
                onClick={() => setIframeKey((value) => value + 1)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
              >
                Refresh
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
              >
                Open
              </a>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          url ? (
            <div
              className={`flex h-full w-full overflow-auto bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.08),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(241,245,249,0.92))] p-4 ${
                viewMode === 'mobile' ? 'items-center justify-center' : ''
              }`}
            >
              {viewMode === 'mobile' ? (
                <div className="flex h-full max-h-full w-full max-w-[390px] flex-col rounded-[34px] border-[10px] border-slate-950 bg-slate-950 p-[6px] shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
                  <div className="mx-auto my-1 h-1.5 w-20 rounded-full bg-slate-700" />
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
                <div className="h-full w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
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
            <div className="flex h-full items-center justify-center bg-slate-50 text-center">
              <div>
                <p className="text-base font-semibold text-slate-700">
                  {isReady ? 'Preview unavailable' : 'Preparing preview'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {isReady ? 'You can still inspect files and download the project.' : 'The sandbox is starting.'}
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="h-full overflow-y-auto bg-slate-950 p-4 font-mono text-xs text-slate-300">
            {logs.length === 0 ? <p>No logs yet.</p> : logs.map((log) => <p key={`${log}-${Math.random()}`}>{log}</p>)}
          </div>
        )}
      </div>
    </div>
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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
        active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
    </button>
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
