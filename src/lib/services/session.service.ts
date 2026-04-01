import { cookies } from 'next/headers';
import { UserService } from './user.service';

const SESSION_COOKIE_NAME = 'asb_session_id';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 12);
  const extra = Math.random().toString(36).slice(2, 8);
  return `sess_${timestamp}_${randomPart}${extra}`;
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = generateSessionId();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  }

  return UserService.findOrCreateBySession(sessionId);
}

export function getSessionId() {
  return cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
}
