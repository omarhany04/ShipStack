'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { BoltIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, ShieldIcon, SparkleIcon, SpinnerIcon } from '../icons';

export default function LoginPage() {
  const router = useRouter();
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
  const { isAuthenticated, isLoading: sessionLoading, login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccessMessage('Account created successfully. Sign in to continue.');
      }
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email.trim().toLowerCase(), password);
    if (!result.success) {
      setError(result.error ?? 'Unable to sign in.');
      setIsSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(83,119,153,0.18)] border-t-[color:var(--brand-secondary)]" />
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="theme-dark-panel relative hidden overflow-hidden rounded-[32px] p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="ambient-mesh ambient-mesh-cool pointer-events-none absolute -right-24 -top-24 h-72 w-72" />
        <div className="ambient-mesh ambient-mesh-warm pointer-events-none absolute -bottom-28 -left-16 h-72 w-72" />

        <div className="relative">
          <span className="theme-status-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
            <SparkleIcon className="h-3.5 w-3.5" />
            Welcome back
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
            Sign in to keep building.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
            Pick up your generators, project history, and live previews right where you left off.
          </p>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-3">
          <StatCard icon={<BoltIcon className="h-5 w-5" />} value="< 2 min" label="Avg. build time" />
          <StatCard icon={<ShieldIcon className="h-5 w-5" />} value="Encrypted" label="Account security" />
          <StatCard icon={<SparkleIcon className="h-5 w-5" />} value="10k+" label="Projects shipped" />
        </div>
      </section>

      <section className="glass-panel-strong rounded-[32px] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="theme-icon-badge inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold">
              S
            </span>
            <div>
              <p className="text-lg font-bold text-slate-950">ShipStack</p>
              <p className="text-sm text-slate-500">Sign in to continue building</p>
            </div>
          </Link>
        </div>

        {successMessage ? (
          <Banner tone="success" message={successMessage} />
        ) : null}
        {error ? <Banner tone="error" message={error} /> : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          {googleEnabled ? (
            <button
              type="button"
              onClick={() => {
                void loginWithGoogle();
              }}
              disabled={isSubmitting}
              className="theme-button-secondary inline-flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleMark />
              Continue with Google
            </button>
          ) : null}

          {googleEnabled ? (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[rgba(248,250,252,0.96)] px-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                  Or use email
                </span>
              </div>
            </div>
          ) : null}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
                disabled={isSubmitting}
                className="theme-input block w-full rounded-2xl px-11 py-3 text-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <span className="text-xs font-medium text-slate-400">Password reset coming soon</span>
            </div>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="theme-input block w-full rounded-2xl px-11 py-3 text-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <SpinnerIcon /> : null}
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[rgba(248,250,252,0.96)] px-4 text-xs uppercase tracking-[0.24em] text-slate-400">
              New here
            </span>
          </div>
        </div>

        <Link
          href="/auth/signup"
          className="theme-button-secondary inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
        >
          Create an account
        </Link>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M21.805 10.023h-9.78v3.955h5.612c-.241 1.273-.965 2.351-2.056 3.073v2.549h3.322c1.945-1.79 3.061-4.43 2.902-7.38-.014-.74-.14-1.476-.373-2.197Z"
        fill="#4285F4"
      />
      <path
        d="M12.025 22c2.64 0 4.857-.874 6.477-2.4l-3.322-2.549c-.925.621-2.108.986-3.155.986-2.42 0-4.472-1.633-5.205-3.822H3.39v2.628A9.978 9.978 0 0 0 12.025 22Z"
        fill="#34A853"
      />
      <path
        d="M6.82 14.215a5.991 5.991 0 0 1-.291-1.875c0-.65.105-1.283.291-1.875V7.837H3.39A9.978 9.978 0 0 0 2 12.34c0 1.609.383 3.133 1.39 4.503l3.43-2.628Z"
        fill="#FBBC05"
      />
      <path
        d="M12.025 6.642c1.435 0 2.724.494 3.738 1.464l2.805-2.804C16.878 3.688 14.664 2.68 12.025 2.68A9.978 9.978 0 0 0 3.39 7.837l3.43 2.628c.733-2.19 2.785-3.823 5.205-3.823Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm transition hover:bg-white/[0.14]">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#eadbcb]">
        {icon}
      </div>
      <p className="mt-3 text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
    </div>
  );
}

function Banner({
  tone,
  message,
}: {
  tone: 'success' | 'error';
  message: string;
}) {
  const toneClasses =
    tone === 'success'
      ? 'theme-status-success'
      : 'theme-status-danger';

  return (
    <div className={`mb-5 rounded-2xl px-4 py-3 text-sm ${toneClasses}`}>
      {message}
    </div>
  );
}
