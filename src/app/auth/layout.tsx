import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon } from './icons';

export const metadata: Metadata = {
  title: 'ShipStack — Authentication',
  description: 'Sign in to ShipStack to build and manage AI-generated products.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(185,130,77,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(83,119,153,0.14),_transparent_36%),linear-gradient(180deg,_rgba(248,245,239,0.98),_rgba(238,243,247,0.98))]" />
      <div className="absolute inset-0 -z-10 bg-mesh opacity-70" />

      <Link
        href="/"
        className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-600 backdrop-blur transition hover:border-[rgba(83,119,153,0.34)] hover:text-slate-900 sm:left-8 sm:top-8"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Back to ShipStack
      </Link>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-fade-up w-full">{children}</div>
      </div>
    </div>
  );
}
