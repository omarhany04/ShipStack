'use client';

interface SideAmbientMotionProps {
  progress: number;
}

export default function SideAmbientMotion({
  progress,
}: SideAmbientMotionProps) {
  const boundedProgress = Math.max(14, Math.min(100, Math.round(progress)));
  const leftBars = [
    Math.max(26, boundedProgress - 20),
    Math.max(34, boundedProgress - 8),
    Math.max(42, Math.min(100, boundedProgress + 10)),
  ];
  const rightBars = [
    Math.max(28, Math.min(92, boundedProgress * 0.72)),
    Math.max(36, Math.min(96, boundedProgress * 0.88)),
    Math.max(44, Math.min(100, boundedProgress + 6)),
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 hidden min-[1500px]:block"
    >
      <div className="absolute left-0 top-8 h-[50rem] w-44 -translate-x-[calc(100%+2.75rem)]">
        <div className="absolute left-6 top-14 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(185,130,77,0.24),_transparent_68%)] blur-3xl animate-float-drift" />
        <div className="absolute bottom-20 left-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(83,119,153,0.18),_transparent_72%)] blur-3xl animate-float-drift-delayed" />
        <div className="absolute inset-y-10 left-[5.4rem] w-px bg-[linear-gradient(180deg,rgba(185,130,77,0),rgba(185,130,77,0.28)_16%,rgba(83,119,153,0.34)_50%,rgba(83,119,153,0.08)_78%,rgba(83,119,153,0))]" />

        <section className="ambient-side-card absolute left-0 top-10 w-40 animate-float-drift">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--brand-accent)] shadow-[0_0_0_8px_rgba(185,130,77,0.14)] animate-pulse-glow" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-accent-strong)]/72">
              Build pulse
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {leftBars.map((width, index) => (
              <div
                key={`left-bar-${index}`}
                className="overflow-hidden rounded-full bg-white/75"
              >
                <div
                  className="animate-wave-shift h-2 origin-left rounded-full bg-[linear-gradient(90deg,rgba(185,130,77,0.95),rgba(83,119,153,0.72))]"
                  style={{
                    width: `${width}%`,
                    animationDelay: `${index * 280}ms`,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <span
                key={`left-dot-${index}`}
                className="h-2.5 w-2.5 rounded-full bg-[rgba(83,119,153,0.22)] animate-pulse-glow"
                style={{ animationDelay: `${index * 160}ms` }}
              />
            ))}
          </div>
        </section>

        <div className="absolute left-[1.1rem] top-60 h-36 w-36 animate-float-drift-delayed">
          <div className="absolute inset-0 rounded-full border border-white/55 bg-[radial-gradient(circle,_rgba(255,255,255,0.52),_rgba(255,255,255,0.16)_62%,_transparent_78%)]" />
          <div className="absolute inset-3 rounded-full border border-[rgba(185,130,77,0.26)]" />
          <div className="absolute inset-8 rounded-full border border-[rgba(83,119,153,0.22)]" />
          <div className="animate-rotate-slow absolute inset-0">
            <span className="absolute left-1/2 top-[-4px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[color:var(--brand-accent)] shadow-[0_0_0_8px_rgba(185,130,77,0.12)]" />
            <span className="absolute bottom-4 right-5 h-2 w-2 rounded-full bg-[color:var(--brand-secondary)] shadow-[0_0_0_8px_rgba(83,119,153,0.12)]" />
          </div>
          <div className="animate-pulse-glow absolute inset-10 rounded-full bg-[radial-gradient(circle,_rgba(185,130,77,0.18),_transparent_72%)]" />
        </div>

        <section className="ambient-side-card ambient-side-grid absolute bottom-12 left-2 w-36 animate-float-drift-delayed">
          <div className="h-14 rounded-[18px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.54),rgba(255,255,255,0.18))]">
            <div className="flex h-full items-end gap-2 px-3 pb-3">
              {[28, 52, 38, 66].map((height, index) => (
                <span
                  key={`left-column-${index}`}
                  className="animate-wave-shift w-2 rounded-full bg-[linear-gradient(180deg,rgba(83,119,153,0.28),rgba(83,119,153,0.82))]"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${180 + index * 140}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="absolute right-0 top-8 h-[50rem] w-44 translate-x-[calc(100%+2.75rem)]">
        <div className="absolute right-6 top-20 h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(83,119,153,0.22),_transparent_68%)] blur-3xl animate-float-drift-delayed" />
        <div className="absolute bottom-14 right-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(185,130,77,0.18),_transparent_72%)] blur-3xl animate-float-drift" />
        <div className="absolute inset-y-10 right-[5.4rem] w-px bg-[linear-gradient(180deg,rgba(83,119,153,0),rgba(83,119,153,0.26)_18%,rgba(185,130,77,0.28)_52%,rgba(185,130,77,0.08)_80%,rgba(185,130,77,0))]" />

        <section className="ambient-side-card absolute right-0 top-16 w-40 animate-float-drift-delayed">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-secondary-strong)]/72">
              Preview sync
            </span>
            <span className="h-2 w-2 rounded-full bg-[color:var(--brand-secondary)] shadow-[0_0_0_8px_rgba(83,119,153,0.12)] animate-pulse-glow" />
          </div>

          <div className="relative mt-5 h-24 overflow-hidden rounded-[20px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.18))]">
            <div className="animate-aurora-pan absolute inset-0 bg-[linear-gradient(130deg,rgba(83,119,153,0.14),rgba(255,255,255,0),rgba(185,130,77,0.16))]" />
            <div className="absolute inset-x-4 top-4 h-px bg-[linear-gradient(90deg,rgba(83,119,153,0),rgba(83,119,153,0.34),rgba(83,119,153,0))]" />
            <div className="absolute inset-x-4 top-1/2 h-px bg-[linear-gradient(90deg,rgba(83,119,153,0),rgba(83,119,153,0.22),rgba(83,119,153,0))]" />
            <div className="absolute inset-x-4 bottom-4 h-px bg-[linear-gradient(90deg,rgba(83,119,153,0),rgba(83,119,153,0.3),rgba(83,119,153,0))]" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border border-[rgba(83,119,153,0.24)]" />
                <div className="absolute inset-2 rounded-full border border-[rgba(185,130,77,0.24)]" />
                <div className="animate-rotate-slow absolute inset-0">
                  <span className="absolute left-1/2 top-[-2px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[color:var(--brand-secondary)]" />
                  <span className="absolute bottom-1 right-2 h-2 w-2 rounded-full bg-[color:var(--brand-accent)]" />
                </div>
                <div className="absolute inset-[18px] rounded-full bg-[radial-gradient(circle,_rgba(83,119,153,0.18),_transparent_72%)] animate-pulse-glow" />
              </div>
            </div>
          </div>
        </section>

        <section className="ambient-side-card absolute right-1 top-64 w-36 animate-float-drift">
          <div className="space-y-3">
            {rightBars.map((width, index) => (
              <div
                key={`right-bar-${index}`}
                className="overflow-hidden rounded-full bg-white/75"
              >
                <div
                  className="animate-wave-shift h-2 origin-left rounded-full bg-[linear-gradient(90deg,rgba(83,119,153,0.88),rgba(185,130,77,0.64))]"
                  style={{
                    width: `${width}%`,
                    animationDelay: `${220 + index * 220}ms`,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {[0, 1, 2].map((item) => (
              <span
                key={`right-pill-${item}`}
                className="h-6 flex-1 rounded-full border border-white/55 bg-white/44 animate-pulse-glow"
                style={{ animationDelay: `${item * 220}ms` }}
              />
            ))}
          </div>
        </section>

        <div className="absolute bottom-10 right-0 h-40 w-40 animate-float-drift-delayed">
          <div className="absolute inset-0 rounded-[30px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.12))]" />
          <div className="ambient-side-grid absolute inset-0 rounded-[30px]" />
          <div className="absolute inset-x-5 top-8 h-[1px] bg-[linear-gradient(90deg,rgba(185,130,77,0),rgba(185,130,77,0.44),rgba(185,130,77,0))]" />
          <div className="absolute inset-x-5 bottom-8 h-[1px] bg-[linear-gradient(90deg,rgba(83,119,153,0),rgba(83,119,153,0.4),rgba(83,119,153,0))]" />
          <div className="animate-pulse-glow absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.52),rgba(83,119,153,0.14)_52%,transparent_74%)]" />
        </div>
      </div>
    </div>
  );
}
