'use client';

import { SessionProvider } from 'next-auth/react';
import WebsiteAssistant from './components/WebsiteAssistant';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <WebsiteAssistant />
    </SessionProvider>
  );
}
