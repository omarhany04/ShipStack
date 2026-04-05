import type { Metadata } from 'next';

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
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
