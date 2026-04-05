'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import PhonePreviewFrame from './PhonePreviewFrame';

interface StandalonePreviewProps {
  url: string | null;
}

type ViewMode = 'desktop' | 'mobile';

export default function StandalonePreview({ url }: StandalonePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const isValidUrl = useMemo(() => isAllowedPreviewUrl(url), [url]);

  if (!url || !isValidUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.94))] px-6 py-12">
        <div className="w-full max-w-2xl rounded-[36px] border border-white/80 bg-white/90 p-8 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
            Preview
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Preview link is unavailable
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            The live preview URL could not be opened in a standalone tab. Return to
            ShipStack and reopen the project preview first.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Back to builder
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.1),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.94))]">
      <header className="border-b border-white/70 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Standalone Preview
            </p>
            <h1 className="mt-2 text-xl font-bold text-slate-950">
              Full-page generated app preview
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <IconButton
              label="Refresh preview"
              onClick={() => setIframeKey((value) => value + 1)}
              icon={<RefreshIcon />}
            />

          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div
          className={`mx-auto flex h-[calc(100vh-128px)] max-h-[1200px] w-full max-w-7xl overflow-auto rounded-[34px] border border-white/70 bg-white/55 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur ${
            viewMode === 'mobile' ? 'items-center justify-center' : ''
          }`}
        >
          {viewMode === 'mobile' ? (
            <PhonePreviewFrame
              iframeKey={`${iframeKey}-${viewMode}`}
              src={url}
              title="Standalone generated app preview"
            />
          ) : (
            <div className="h-full w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
              <iframe
                key={`${iframeKey}-${viewMode}`}
                src={url}
                title="Standalone generated app preview"
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function isAllowedPreviewUrl(value: string | null) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.hostname.endsWith('webcontainer-api.io')
    );
  } catch {
    return false;
  }
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
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
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
