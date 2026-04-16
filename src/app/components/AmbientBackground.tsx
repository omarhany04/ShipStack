export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="ambient-shell absolute inset-0" />
      <div className="ambient-grid absolute inset-0 opacity-60" />
      <div className="ambient-sheen ambient-sheen-left absolute inset-y-[-18%] left-[-18%] w-[42rem]" />
      <div className="ambient-sheen ambient-sheen-right absolute inset-y-[-24%] right-[-18%] w-[38rem]" />

      <div className="ambient-orb ambient-orb-primary absolute left-[-8rem] top-[8%] h-[28rem] w-[28rem]" />
      <div className="ambient-orb ambient-orb-secondary absolute right-[-10rem] top-[18%] h-[26rem] w-[26rem]" />
      <div className="ambient-orb ambient-orb-tertiary absolute bottom-[-10rem] left-[26%] h-[24rem] w-[24rem]" />

      <div className="ambient-ring absolute left-[10%] top-[16%] h-56 w-56 rounded-full" />
      <div className="ambient-ring ambient-ring-delayed absolute bottom-[10%] right-[12%] h-72 w-72 rounded-full" />

      <div className="ambient-pulse absolute left-[18%] top-[22%] h-3 w-3 rounded-full" />
      <div className="ambient-pulse ambient-pulse-delayed absolute right-[22%] top-[34%] h-2.5 w-2.5 rounded-full" />
      <div className="ambient-pulse ambient-pulse-slow absolute bottom-[18%] left-[64%] h-2 w-2 rounded-full" />
    </div>
  );
}
