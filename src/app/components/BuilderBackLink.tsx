import Link from 'next/link';

interface BuilderBackLinkProps {
  title?: string;
  description?: string;
}

export default function BuilderBackLink({
  title = 'Back to builder',
  description = 'Return to the main ShipStack workspace to generate, refine, and preview projects.',
}: BuilderBackLinkProps) {
  return (
    <div className="mb-6">
      <Link
        href="/"
        className="group inline-flex w-full items-center justify-between gap-4 overflow-hidden rounded-[28px] border border-orange-200 bg-[radial-gradient(circle_at_left,_rgba(249,115,22,0.16),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(255,247,237,0.94))] px-5 py-4 shadow-[0_16px_50px_rgba(249,115,22,0.08)] transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_20px_60px_rgba(249,115,22,0.12)]"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] bg-slate-950 text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)]">
            <BuilderGlyph />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-600">
              Builder Navigation
            </span>
            <span className="mt-1 block text-base font-semibold text-slate-950">{title}</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
          </span>
        </div>

        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 transition group-hover:border-orange-300 group-hover:text-orange-600">
          <ArrowLeftIcon />
        </span>
      </Link>
    </div>
  );
}

function BuilderGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 4.75 7.75v8.5L12 20.5l7.25-4.25v-8.5L12 3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 10.25 3.5 2 3.5-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.25v4.25" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}
