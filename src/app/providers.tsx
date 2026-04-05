'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

const WebsiteAssistant = dynamic(() => import('./components/WebsiteAssistant'), {
  ssr: false,
});

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(() => setShowAssistant(true), {
        timeout: 1600,
      });

      return () => {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = globalThis.setTimeout(() => setShowAssistant(true), 1000);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
      {showAssistant ? <WebsiteAssistant /> : null}
    </SessionProvider>
  );
}
