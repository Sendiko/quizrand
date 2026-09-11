import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'quizrand_session';
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encodedSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'quizrand-jwt-secret-key-development-2026-safe-fallback'
);

export interface SessionUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
}

/**
 * Signs a JWT token with user information and sets the HTTP-only session cookie.
 */
export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRATION_SECONDS,
    path: '/',
  });

  return token;
}

/**
 * Retrieves and verifies the active user session from HTTP cookies.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ['HS256'],
    });

    return {
      id: payload.id as string,
      name: (payload.name as string) || null,
      username: (payload.username as string) || null,
      email: payload.email as string,
      role: (payload.role as string) || 'USER',
    };
  } catch {
    return null;
  }
}

/**
 * Clears the session cookie to log out the user.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
