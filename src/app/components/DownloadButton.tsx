'use client';

import { useState } from 'react';

interface DownloadButtonProps {
  onDownload: () => Promise<void>;
  projectName: string;
  fileCount: number;
  disabled?: boolean;
}

export default function DownloadButton({
  onDownload,
  projectName,
  fileCount,
  disabled,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleClick() {
    if (isDownloading || disabled) {
      return;
    }
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isDownloading || disabled}
      className="inline-flex items-center gap-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{isDownloading ? 'Preparing...' : `Download ${projectName}.zip`}</span>
      <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium">{fileCount} files</span>
    </button>
  );
}
