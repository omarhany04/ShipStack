import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/prisma';

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function getCurrentSessionUser() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return session.user;
}

export async function getCurrentUser() {
  const sessionUser = await getCurrentSessionUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });

  if (!user || !user.isActive) {
    throw new Error('Unauthorized');
  }

  return user;
}
