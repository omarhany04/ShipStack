import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import { buildAvatarImageUrl } from './avatar';
import { verifyPassword } from './password';

function normalizeDisplayName(name: string | null, email: string) {
  return name?.trim() || email.split('@')[0];
}

function getGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return GoogleProvider({
    clientId,
    clientSecret,
    allowDangerousEmailAccountLinking: true,
  });
}

async function upsertGoogleUser(user: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const normalizedEmail = user.email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isActive: true,
    },
  });

  if (existing && !existing.isActive) {
    return null;
  }

  const resolvedName = normalizeDisplayName(user.name ?? existing?.name ?? null, normalizedEmail);
  const nextAvatar =
    existing?.avatarUrl?.startsWith('data:') ? existing.avatarUrl : user.image ?? existing?.avatarUrl ?? null;

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: resolvedName,
        avatarUrl: nextAvatar,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: resolvedName,
      avatarUrl: nextAvatar,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
    },
  });
}

const googleProvider = getGoogleProvider();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            isActive: true,
            role: true,
            avatarUrl: true,
          },
        });

        if (!user?.email || !user.passwordHash) {
          throw new Error('Invalid email or password.');
        }

        if (!user.isActive) {
          throw new Error('This account has been deactivated.');
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: normalizeDisplayName(user.name, user.email),
          image: user.avatarUrl ? buildAvatarImageUrl() : null,
          role: user.role,
        };
      },
    }),
    ...(googleProvider ? [googleProvider] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') {
        return true;
      }

      const dbUser = await upsertGoogleUser({
        email: user.email,
        name: user.name,
        image: user.image,
      });

      if (!dbUser?.email) {
        return false;
      }

      user.id = dbUser.id;
      user.role = dbUser.role;
      user.name = normalizeDisplayName(dbUser.name, dbUser.email);
      user.email = dbUser.email;
      user.image = dbUser.avatarUrl ? buildAvatarImageUrl() : null;

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'USER';
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image ?? null;
      }

      if (trigger === 'update' && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.role = session.user.role;
        token.picture = session.user.image ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? 'USER';
        session.user.name = (token.name as string) ?? '';
        session.user.email = (token.email as string) ?? '';
        session.user.image = typeof token.picture === 'string' ? token.picture : null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`[Auth] User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`[Auth] User signed out: ${token.email}`);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === 'true',
};
