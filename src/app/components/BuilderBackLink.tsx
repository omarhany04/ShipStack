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
        className="theme-icon-button group inline-flex h-14 w-14 items-center justify-center rounded-full transition hover:-translate-y-0.5"
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
