import Link from 'next/link';

interface BuilderBackLinkProps {
  title?: string;
  description?: string;
}

export default function BuilderBackLink({
  title = 'Back to builder',
}: BuilderBackLinkProps) {
  return (
    <div className="mb-6 flex justify-start">
      <Link
        href="/"
        aria-label={title}
        title={title}
        className="group inline-flex h-14 w-14 items-center justify-center rounded-full border border-orange-300 bg-orange-50/70 text-orange-700 shadow-[0_18px_44px_rgba(249,115,22,0.12)] transition hover:-translate-y-0.5 hover:border-slate-900 hover:bg-slate-950 hover:text-white hover:shadow-[0_20px_48px_rgba(15,23,42,0.18)]"
      >
        <ArrowLeftIcon />
      </Link>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.75 18.5 8.25 12l6.5-6.5" />
    </svg>
  );
}
