'use client';

import Link from 'next/link';
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import { BUILDER_SCROLL_TARGET, markBuilderScrollTarget } from '@/lib/builder-scroll';

type BuilderScrollLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'href'> & {
  children: ReactNode;
};

export default function BuilderScrollLink({
  children,
  onClick,
  ...props
}: BuilderScrollLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    markBuilderScrollTarget();
    onClick?.(event);
  }

  return (
    <Link href={`/#${BUILDER_SCROLL_TARGET}`} scroll={false} {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
