'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
  const { isAuthenticated, isLoading: sessionLoading, signup, loginWithGoogle } = useAuth();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', met: form.password.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(form.password) },
      { label: 'One lowercase letter', met: /[a-z]/.test(form.password) },
      { label: 'One number', met: /[0-9]/.test(form.password) },
    ],
    [form.password]
  );

  const passwordStrength = useMemo(() => {
    const score = passwordChecks.filter((check) => check.met).length;

    if (score <= 1) {
      return { label: 'Weak', width: 'w-1/4', color: 'bg-rose-500', text: 'text-rose-600' };
    }

    if (score === 2) {
      return { label: 'Fair', width: 'w-2/4', color: 'bg-amber-500', text: 'text-amber-600' };
    }

    if (score === 3) {
      return { label: 'Good', width: 'w-3/4', color: 'bg-orange-500', text: 'text-orange-600' };
    }

    return { label: 'Strong', width: 'w-full', color: 'bg-emerald-500', text: 'text-emerald-600' };
  }, [passwordChecks]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setServerError(null);
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === 'password' ? { confirmPassword: undefined } : {}),
    }));
  }

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.';
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(form.password)) {
      nextErrors.password = 'Password must contain an uppercase letter.';
    } else if (!/[a-z]/.test(form.password)) {
      nextErrors.password = 'Password must contain a lowercase letter.';
    } else if (!/[0-9]/.test(form.password)) {
      nextErrors.password = 'Password must contain a number.';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    const result = await signup({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    if (!result.success) {
      setIsSubmitting(false);

      if (result.field) {
        setFieldErrors({ [result.field]: result.error });
        return;
      }

      setServerError(result.error ?? 'Unable to create your account.');
      return;
    }

    router.push('/auth/login?registered=true');
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.98fr_1.02fr]">
      <section className="rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
        <div className="mb-8">
          <Link href="/auth/login" className="inline-flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white shadow-lg shadow-orange-500/30">
              S
            </span>
            <div>
              <p className="text-lg font-bold text-slate-950">ShipStack</p>
              <p className="text-sm text-slate-500">Create your account</p>
            </div>
          </Link>
        </div>

        {serverError ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          {googleEnabled ? (
            <>
              <button
                type="button"
                onClick={() => {
                  void loginWithGoogle();
                }}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleMark />
                Sign up with Google
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                    Or create with email
                  </span>
                </div>
              </div>
            </>
          ) : null}

          <Field
            id="name"
            label="Full name"
            value={form.name}
            onChange={(value) => updateField('name', value)}
            error={fieldErrors.name}
            placeholder="Jane Doe"
            autoComplete="name"
            disabled={isSubmitting}
          />

          <Field
            id="email"
            label="Email address"
            type="email"
            value={form.email}
            onChange={(value) => updateField('email', value)}
            error={fieldErrors.email}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
          />

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                autoComplete="new-password"
                placeholder="Create a strong password"
                disabled={isSubmitting}
                className={`block w-full rounded-2xl border px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                  fieldErrors.password
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-orange-400 focus:ring-orange-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 transition hover:text-slate-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-2 text-xs text-rose-600">{fieldErrors.password}</p>
            ) : null}

            {form.password ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div className={`h-2 rounded-full ${passwordStrength.width} ${passwordStrength.color}`} />
                  </div>
                  <span className={`text-xs font-semibold ${passwordStrength.text}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {passwordChecks.map((check) => (
                    <p
                      key={check.label}
                      className={`flex items-center gap-2 text-xs ${
                        check.met ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          check.met
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        •
                      </span>
                      {check.label}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Field
            id="confirmPassword"
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(value) => updateField('confirmPassword', value)}
            error={fieldErrors.confirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
            <input
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
            />
            <span>
              I agree to the terms of service and privacy policy for this workspace.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      </section>

      <section className="hidden rounded-[32px] border border-white/70 bg-white/70 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
            Product workspace
          </p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-950">
            Save every generated project under your own account.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Once you sign up, ShipStack protects the builder, ties generations to your identity, and keeps project history ready for follow-up work.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FeaturePill title="Saved projects" text="Backed by Prisma + Postgres" />
          <FeaturePill title="Protected APIs" text="Credentials-based access" />
          <FeaturePill title="Usage visibility" text="Health and stats stay private" />
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  disabled,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`block w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-200 focus:border-orange-400 focus:ring-orange-100'
        }`}
      />
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function FeaturePill({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
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
