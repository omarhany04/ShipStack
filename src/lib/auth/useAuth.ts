'use client';

import { useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

function normalizeAuthError(error?: string | null) {
  if (!error) {
    return undefined;
  }

  if (error === 'CredentialsSignin' || error === 'CallbackRouteError') {
    return 'Invalid email or password.';
  }

  return error;
}

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          return {
            success: false as const,
            error: normalizeAuthError(result.error),
          };
        }

        router.push('/');
        router.refresh();

        return { success: true as const };
      } catch {
        return {
          success: false as const,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/auth/login' });
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signIn('google', { callbackUrl: '/' });
  }, []);

  const signup = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!result.success) {
          return {
            success: false as const,
            error: result.error as string,
            field: result.field as string | undefined,
            errors: result.errors as string[] | undefined,
          };
        }

        return { success: true as const };
      } catch {
        return {
          success: false as const,
          error: 'An unexpected error occurred. Please try again.',
        };
      }
    },
    []
  );

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    loginWithGoogle,
    logout,
    signup,
    refreshSession: update,
  };
}
