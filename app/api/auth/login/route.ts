import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validations/login';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username: identifier, password } = validation.data;
    const normalized = identifier.trim().toLowerCase();

    // Query user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: normalized }, { email: normalized }],
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
        },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
        },
        { status: 401 }
      );
    }

    const token = await createSession({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Logged in successfully',
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
