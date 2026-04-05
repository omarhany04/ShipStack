interface PhonePreviewFrameProps {
  src: string;
  title: string;
  iframeKey: string;
}

export default function PhonePreviewFrame({
  src,
  title,
  iframeKey,
}: PhonePreviewFrameProps) {
  return (
    <div
      className="relative h-full max-h-full w-auto max-w-[468px] flex-shrink-0"
      style={{ aspectRatio: '428 / 844' }}
    >
      <span className="pointer-events-none absolute -left-[3px] top-[18%] h-14 w-[4px] rounded-l-full bg-[linear-gradient(180deg,#cbd5e1,#64748b_55%,#0f172a)] shadow-[0_6px_18px_rgba(15,23,42,0.22)]" />
      <span className="pointer-events-none absolute -left-[3px] top-[27%] h-24 w-[4px] rounded-l-full bg-[linear-gradient(180deg,#cbd5e1,#64748b_55%,#0f172a)] shadow-[0_6px_18px_rgba(15,23,42,0.22)]" />
      <span className="pointer-events-none absolute -left-[3px] top-[39%] h-24 w-[4px] rounded-l-full bg-[linear-gradient(180deg,#cbd5e1,#64748b_55%,#0f172a)] shadow-[0_6px_18px_rgba(15,23,42,0.22)]" />
      <span className="pointer-events-none absolute -right-[3px] top-[30%] h-28 w-[4px] rounded-r-full bg-[linear-gradient(180deg,#cbd5e1,#64748b_55%,#0f172a)] shadow-[0_6px_18px_rgba(15,23,42,0.22)]" />

      <div className="relative h-full w-full rounded-[54px] bg-[linear-gradient(160deg,rgba(255,255,255,0.92)_0%,rgba(148,163,184,0.72)_18%,rgba(15,23,42,0.96)_42%,rgba(2,6,23,1)_100%)] p-[3px] shadow-[0_40px_120px_rgba(15,23,42,0.34)]">
        <div className="relative flex h-full min-h-0 flex-col rounded-[51px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,#111827_0%,#020617_42%,#000000_100%)] p-[8px]">
          <div className="pointer-events-none absolute inset-x-10 top-3 h-10 rounded-full bg-white/6 blur-2xl" />

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[42px] bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_18px_36px_rgba(0,0,0,0.24)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-white/16 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-black shadow-[0_0_0_1.5px_rgba(15,23,42,0.96),0_0_0_4px_rgba(255,255,255,0.05)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-2.5">
              <div className="h-1 w-20 rounded-full bg-black/16 shadow-[0_1px_8px_rgba(15,23,42,0.12)]" />
            </div>
            <iframe
              key={iframeKey}
              src={src}
              title={title}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
