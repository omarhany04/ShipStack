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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    router.prefetch('/projects');
    router.prefetch('/account');
  }, [isOpen, router]);

  if (isLoading) {
    return <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />;
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
        className="glass-panel inline-flex items-center gap-3 rounded-full px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="hidden sm:block">
          <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="max-w-[140px] truncate text-xs text-slate-500">Workspace account</p>
        </div>
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
            {initials}
          </div>
        )}
      </button>

      {isOpen ? (
        <div className="glass-panel-strong absolute right-0 mt-3 w-80 rounded-[30px] p-3 shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
          <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] px-4 py-4">
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-12 w-12 rounded-full border border-white object-cover shadow-sm"
                />
              ) : (
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white shadow-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-950">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                {user.role}
              </span>
              <span className="text-xs text-slate-400">Saved projects and account tools</span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <MenuButton
              label="My projects"
              description="Browse and reopen saved generated apps"
              icon={<ProjectsIcon />}
              onClick={() => {
                setIsOpen(false);
                router.push('/projects');
              }}
            />
            <MenuButton
              label="Account settings"
              description="Update profile, password, and sign-in methods"
              icon={<AccountIcon />}
              onClick={() => {
                setIsOpen(false);
                router.push('/account');
              }}
            />
            <MenuButton
              label="Sign out"
              description="End this session on this device"
              icon={<LogoutIcon />}
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
  description,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void | Promise<void>;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void onClick();
      }}
      className={`flex w-full items-center gap-3 rounded-[22px] border px-4 py-3.5 text-left transition ${
        danger
          ? 'border-rose-100 bg-rose-50/50 text-rose-600 hover:border-rose-200 hover:bg-rose-50'
          : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
      }`}
    >
      <span
        className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${
          danger
            ? 'border-rose-200 bg-white text-rose-500'
            : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className={`mt-1 block text-xs ${danger ? 'text-rose-400' : 'text-slate-400'}`}>
          {description}
        </span>
      </span>
    </button>
  );
}

function AccountIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.25a8.25 8.25 0 0 1 14.998 0"
      />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h4.379c.398 0 .779.158 1.06.439l1.622 1.622c.281.281.663.439 1.06.439H18a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25v-10.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 13.5h9M7.5 10.5h5.25" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}
