'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';

export default function UserMenu() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (isLoading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />;
  }

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
      >
        <div className="hidden sm:block">
          <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="max-w-[140px] truncate text-xs text-slate-500">{user.email}</p>
        </div>
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
            {initials}
          </div>
        )}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-3 w-72 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
          <div className="rounded-[18px] bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
            <p className="mt-3 inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
              {user.role}
            </p>
          </div>

          <div className="mt-2 space-y-1">
            <MenuButton
              label="Account settings"
              onClick={() => {
                setIsOpen(false);
                router.push('/account');
              }}
            />
            <MenuButton
              label="Open saved projects"
              onClick={() => {
                setIsOpen(false);
                window.open('/api/projects', '_blank', 'noopener,noreferrer');
              }}
            />
            <MenuButton
              label="Open usage stats"
              onClick={() => {
                setIsOpen(false);
                window.open('/api/usage', '_blank', 'noopener,noreferrer');
              }}
            />
            <MenuButton
              label="Sign out"
              danger
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void onClick();
      }}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
        danger
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs opacity-60">→</span>
    </button>
  );
}
