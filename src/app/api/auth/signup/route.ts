import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  hashPassword,
  validateEmail,
  validateName,
  validatePassword,
} from '@/lib/auth/password';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: SignupRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const { name, email, password, confirmPassword } = body;

    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error, field: 'name' },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error, field: 'email' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.errors[0],
          errors: passwordValidation.errors,
          field: 'password',
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passwords do not match.',
          field: 'confirmPassword',
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists.',
          field: 'email',
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`[Auth] New user created: ${user.email} (${user.id})`);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. You can now sign in.',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
