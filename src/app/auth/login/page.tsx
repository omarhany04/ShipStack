'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden rounded-[32px] border border-white/70 bg-white/70 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
            ShipStack Access
          </p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-950">
            Build faster behind a proper auth gate.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Secure your generators, project history, and usage data with a clean sign-in flow built for product teams.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard label="Protected routes" value="Middleware" />
          <FeatureCard label="Session strategy" value="JWT" />
          <FeatureCard label="Password storage" value="bcryptjs" />
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
        <div className="mb-8">
          <Link href="/auth/login" className="inline-flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white shadow-lg shadow-orange-500/30">
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
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                <span className="bg-white px-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                  Or use email
                </span>
              </div>
            </div>
          ) : null}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
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
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <span className="text-xs font-medium text-slate-400">Password reset coming soon</span>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 transition hover:text-slate-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs uppercase tracking-[0.24em] text-slate-400">
              New here
            </span>
          </div>
        </div>

        <Link
          href="/auth/signup"
          className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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

function FeatureCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
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
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}>
      {message}
    </div>
  );
}
