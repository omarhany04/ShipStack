import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import { authOptions } from '@/lib/auth/auth.config';
import './globals.css';
import Providers from './providers';

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
});

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'ShipStack — Build Apps with AI',
  description:
    'Describe a product idea in plain English and generate a full Next.js codebase with AI orchestration, validation, persistence, and live preview.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <head>
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
      </head>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
