'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validations/auth';
import { loginSchema } from '@/lib/validations/login';
import { createSession, deleteSession } from '@/lib/session';

export interface RegisterActionResult {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
  };
  errors?: {
    username?: string[];
    email?: string[];
    password?: string[];
    form?: string[];
  };
}

export interface LoginActionResult {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
  };
  errors?: {
    username?: string[];
    password?: string[];
    form?: string[];
  };
}

export async function registerUserAction(
  prevState: RegisterActionResult | null,
  formData: FormData
): Promise<RegisterActionResult> {
  const rawData = {
    username: formData.get('username'),
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
        username: fieldErrors.username,
        email: fieldErrors.email,
        password: fieldErrors.password,
      },
    };
  }

  const { username, email, password } = validation.data;
  const normalizedUsername = username.trim().toLowerCase();

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

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUsername) {
      return {
        success: false,
        message: 'That username is already taken.',
        errors: {
          username: ['This username is already in use. Please choose another one.'],
        },
      };
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name: normalizedUsername,
        username: normalizedUsername,
        email,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
      },
    });

    // Create session cookie automatically upon registration
    await createSession({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
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

export async function loginUserAction(
  prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const rawData = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  const validation = loginSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      message: 'Please provide both username and password.',
      errors: {
        username: fieldErrors.username,
        password: fieldErrors.password,
      },
    };
  }

  const { username, password } = validation.data;
  const normalizedUsername = username.trim().toLowerCase();

  try {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
    });

    if (!user || !user.password) {
      return {
        success: false,
        message: 'Invalid username or password. Please check your credentials.',
        errors: {
          form: ['Invalid username or password.'],
        },
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid username or password. Please check your credentials.',
        errors: {
          form: ['Invalid username or password.'],
        },
      };
    }

    // Create session cookie
    await createSession({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: 'Signed in successfully! Welcome back.',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error) {
    console.error('Login action error:', error);
    return {
      success: false,
      message: 'An error occurred during sign in. Please try again.',
      errors: {
        form: ['An unexpected error occurred. Please try again later.'],
      },
    };
  }
}

export async function logoutUserAction(): Promise<void> {
  await deleteSession();
}
