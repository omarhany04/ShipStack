import { NextResponse } from 'next/server';
import { parseAvatarDataUrl } from '@/lib/auth/avatar';
import { getCurrentUser } from '@/lib/services/session.service';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();

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
        'Cache-Control': 'private, no-store, max-age=0',
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
