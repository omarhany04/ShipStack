'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { buildAvatarImageUrl } from '@/lib/auth/avatar';
import { useAuth } from '@/lib/auth/useAuth';

export interface AccountProfile {
  id?: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  hasPassword: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AccountSettingsClientProps {
  initialProfile: AccountProfile;
  googleEnabled: boolean;
}

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function AccountSettingsClient({
  initialProfile,
  googleEnabled,
}: AccountSettingsClientProps) {
  const { user, loginWithGoogle, refreshSession } = useAuth();
  const [profile, setProfile] = useState<AccountProfile>(initialProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile.avatarUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);

  const passwordHints = useMemo(
    () => [
      { label: 'At least 8 characters', met: passwordForm.newPassword.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(passwordForm.newPassword) },
      { label: 'One lowercase letter', met: /[a-z]/.test(passwordForm.newPassword) },
      { label: 'One number', met: /[0-9]/.test(passwordForm.newPassword) },
    ],
    [passwordForm.newPassword]
  );

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setProfileError('Please choose a PNG, JPG, or WebP image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Avatar must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setAvatarPreview(result);
      setRemoveAvatar(false);
      setProfileError(null);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setIsSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          avatarDataUrl: removeAvatar ? undefined : avatarPreview,
          removeAvatar,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update account.');
      }

      setProfile(result.profile);
      setAvatarPreview(result.profile.avatarUrl);
      setRemoveAvatar(false);
      setProfileMessage('Account settings updated.');
      await refreshSession({
        user: {
          id: user?.id ?? result.profile.id ?? '',
          name: result.profile.name,
          email: result.profile.email,
          image: result.profile.avatarUrl ? buildAvatarImageUrl(Date.now()) : null,
          role: result.profile.role,
        },
      });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update account.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function savePassword() {
    setIsSavingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update password.');
      }

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordMessage(result.message);
      setProfile((current) => ({ ...current, hasPassword: true }));
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  const initials = (profile.name || profile.email || 'SS')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
            Account Settings
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            Manage your profile and sign-in options
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Update your display photo, keep your profile details current, and manage password access for your workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel-strong rounded-[30px] p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex flex-col items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile.name}
                  className="h-28 w-28 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="theme-icon-badge flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold">
                  {initials}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <label className="theme-button-secondary inline-flex cursor-pointer rounded-full px-4 py-2 text-sm font-medium">
                  Upload photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(null);
                    setRemoveAvatar(true);
                    setProfileMessage(null);
                  }}
                  className="theme-status-danger rounded-full px-4 py-2 text-sm font-medium transition hover:bg-rose-100"
                >
                  Remove
                </button>
              </div>
              <p className="text-center text-xs text-slate-400">
                PNG, JPG, or WebP. Max 2 MB.
              </p>
            </div>

            <div className="flex-1 space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={profile.name}
                  onChange={(event) => {
                    setProfile((current) => ({ ...current, name: event.target.value }));
                    setProfileMessage(null);
                  }}
                  className="theme-input block w-full rounded-2xl px-4 py-3 text-sm placeholder:text-slate-400"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="theme-card-muted block w-full rounded-2xl px-4 py-3 text-sm text-slate-500"
                />
              </div>

              {profileError ? (
                <p className="theme-status-danger rounded-2xl px-4 py-3 text-sm">
                  {profileError}
                </p>
              ) : null}

              {profileMessage ? (
                <p className="theme-status-success rounded-2xl px-4 py-3 text-sm">
                  {profileMessage}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  void saveProfile();
                }}
                disabled={isSavingProfile}
                className="theme-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? 'Saving profile...' : 'Save profile'}
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="glass-panel-strong rounded-[30px] p-6 shadow-soft sm:p-8">
            <div className="mb-5">
              <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
                Security
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {profile.hasPassword ? 'Change your password' : 'Add a password'}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {profile.hasPassword
                  ? 'Keep your credential login secure with a strong password update.'
                  : 'You can add a password to your account even if you usually sign in with Google.'}
              </p>
            </div>

            <div className="space-y-4">
              {profile.hasPassword ? (
                <div>
                  <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                      }
                      className="theme-input block w-full rounded-2xl px-4 py-3 text-sm"
                    />
                  </div>
                ) : null}

              <div>
                <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  className="theme-input block w-full rounded-2xl px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  className="theme-input block w-full rounded-2xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {passwordHints.map((hint) => (
                <p
                  key={hint.label}
                  className={`flex items-center gap-2 text-xs ${
                    hint.met ? 'text-[color:var(--brand-success)]' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      hint.met
                        ? 'bg-[rgba(34,112,93,0.12)] text-[color:var(--brand-success)]'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    •
                  </span>
                  {hint.label}
                </p>
              ))}
            </div>

            {passwordError ? (
              <p className="theme-status-danger mt-5 rounded-2xl px-4 py-3 text-sm">
                {passwordError}
              </p>
            ) : null}

            {passwordMessage ? (
              <p className="theme-status-success mt-5 rounded-2xl px-4 py-3 text-sm">
                {passwordMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                  void savePassword();
                }}
                disabled={isSavingPassword}
                className="theme-button-primary mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingPassword ? 'Updating password...' : profile.hasPassword ? 'Update password' : 'Add password'}
              </button>
          </section>

          <section className="glass-panel-strong rounded-[30px] p-6 shadow-soft sm:p-8">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
              Sign-in Options
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Google account access</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {googleEnabled
                ? 'Use Google for a faster sign-in path on this workspace.'
                : 'Google sign-in is not configured yet. Add Google client credentials in your environment to enable it.'}
            </p>

            <button
              type="button"
              onClick={() => {
                void loginWithGoogle();
              }}
              disabled={!googleEnabled}
              className="theme-button-secondary mt-5 inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GoogleMark />
              Continue with Google
            </button>
          </section>
        </div>
      </div>
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
