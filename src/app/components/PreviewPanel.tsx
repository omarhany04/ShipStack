'use client';

import { useState } from 'react';

interface PreviewPanelProps {
  url: string | null;
  logs: string[];
  isReady: boolean;
}

type Tab = 'preview' | 'logs';

export default function PreviewPanel({ url, logs, isReady }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
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
            <iframe
              key={iframeKey}
              src={url}
              title="Generated app preview"
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
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
