import { NextResponse } from 'next/server';
import { parseAvatarDataUrl } from '@/lib/auth/avatar';
import prisma from '@/lib/prisma';
import { getCurrentSessionUser } from '@/lib/services/session.service';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const sessionUser = await getCurrentSessionUser();
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return new NextResponse('Authentication required.', { status: 401 });
    }

    if (!user.avatarUrl) {
      return new NextResponse('Avatar not found.', { status: 404 });
    }

    const parsed = parseAvatarDataUrl(user.avatarUrl);
    if (!parsed) {
      return new NextResponse('Invalid avatar data.', { status: 400 });
    }

    return new NextResponse(parsed.buffer, {
      status: 200,
      headers: {
        'Content-Type': parsed.mimeType,
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
        'Content-Length': parsed.buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Authentication required.', { status: 401 });
    }

    return new NextResponse('Failed to load avatar.', { status: 500 });
  }
}
