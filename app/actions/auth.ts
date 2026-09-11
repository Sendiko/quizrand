'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validations/auth';

export interface RegisterActionResult {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    form?: string[];
  };
}

export async function registerUserAction(
  prevState: RegisterActionResult | null,
  formData: FormData
): Promise<RegisterActionResult> {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const validation = registerSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      message: 'Please review the form for errors.',
      errors: {
        name: fieldErrors.name,
        email: fieldErrors.email,
        password: fieldErrors.password,
      },
    };
  }

  const { name, email, password } = validation.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email address already exists.',
        errors: {
          email: ['This email is already in use. Please sign in or use another email.'],
        },
      };
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return {
      success: true,
      message: 'Registration successful! Welcome to QuizRand.',
      user,
    };
  } catch (error) {
    console.error('Registration action error:', error);
    return {
      success: false,
      message: 'Something went wrong while creating your account. Please try again.',
      errors: {
        form: ['An internal error occurred. Please try again later.'],
      },
    };
  }
}
