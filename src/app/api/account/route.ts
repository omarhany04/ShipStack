import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, validateName, validatePassword, verifyPassword } from '@/lib/auth/password';
import { getCurrentUser } from '@/lib/services/session.service';

export const dynamic = 'force-dynamic';

const ALLOWED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_COMPANY_LENGTH = 100;

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Authentication required.',
    },
    { status: 401 }
  );
}

function validateAvatarDataUrl(dataUrl: string): { isValid: true } | { isValid: false; error: string } {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/);

  if (!match) {
    return {
      isValid: false,
      error: 'Avatar must be a PNG, JPG, or WebP image.',
    };
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_AVATAR_TYPES.has(mimeType)) {
    return {
      isValid: false,
      error: 'Avatar must be a PNG, JPG, or WebP image.',
    };
  }

  const bytes = Buffer.from(match[2], 'base64').byteLength;
  if (bytes > MAX_AVATAR_BYTES) {
    return {
      isValid: false,
      error: 'Avatar must be 2 MB or smaller.',
    };
  }

  return { isValid: true };
}

function normalizeCompany(company?: string | null) {
  const value = company?.trim() ?? '';

  if (!value) {
    return { isValid: true as const, value: null };
  }

  if (value.length > MAX_COMPANY_LENGTH) {
    return {
      isValid: false as const,
      error: `Company name must be at most ${MAX_COMPANY_LENGTH} characters.`,
    };
  }

  return { isValid: true as const, value };
}

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name ?? '',
        email: user.email ?? '',
        company: user.company ?? '',
        avatarUrl: user.avatarUrl,
        role: user.role,
        hasPassword: Boolean(user.passwordHash),
      },
      googleEnabled:
        Boolean(process.env.GOOGLE_CLIENT_ID) &&
        Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
        process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load account settings.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const body = (await request.json()) as {
      name?: string;
      company?: string;
      avatarDataUrl?: string | null;
      removeAvatar?: boolean;
    };

    const nameValue = body.name ?? user.name ?? '';
    const nameValidation = validateName(nameValue);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error, field: 'name' },
        { status: 400 }
      );
    }

    const companyValidation = normalizeCompany(body.company);
    if (!companyValidation.isValid) {
      return NextResponse.json(
        { success: false, error: companyValidation.error, field: 'company' },
        { status: 400 }
      );
    }

    let avatarUrl: string | null | undefined;
    if (body.removeAvatar) {
      avatarUrl = null;
    } else if (typeof body.avatarDataUrl === 'string') {
      const avatarValidation = validateAvatarDataUrl(body.avatarDataUrl);
      if (!avatarValidation.isValid) {
        return NextResponse.json(
          { success: false, error: avatarValidation.error, field: 'avatar' },
          { status: 400 }
        );
      }
      avatarUrl = body.avatarDataUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: nameValue.trim(),
        company: companyValidation.value,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        avatarUrl: true,
        role: true,
        passwordHash: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedUser.id,
        name: updatedUser.name ?? '',
        email: updatedUser.email ?? '',
        company: updatedUser.company ?? '',
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        hasPassword: Boolean(updatedUser.passwordHash),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update account settings.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const newPassword = body.newPassword ?? '';
    const confirmPassword = body.confirmPassword ?? '';

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password and confirmation are required.',
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passwords do not match.',
          field: 'confirmPassword',
        },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.errors[0],
          errors: passwordValidation.errors,
          field: 'newPassword',
        },
        { status: 400 }
      );
    }

    if (user.passwordHash) {
      if (!body.currentPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Current password is required.',
            field: 'currentPassword',
          },
          { status: 400 }
        );
      }

      const isCurrentValid = await verifyPassword(body.currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Current password is incorrect.',
            field: 'currentPassword',
          },
          { status: 400 }
        );
      }

      const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
      if (isSamePassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Choose a new password that is different from the current one.',
            field: 'newPassword',
          },
          { status: 400 }
        );
      }
    }

    const nextPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: nextPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: user.passwordHash
        ? 'Password updated successfully.'
        : 'Password added successfully.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update password.',
      },
      { status: 500 }
    );
  }
}
