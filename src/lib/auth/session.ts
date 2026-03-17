export const SESSION_ABSOLUTE_TTL_MS = 1000 * 60 * 60 * 12
export const SESSION_IDLE_TTL_MS = 1000 * 60 * 60 * 2
export const SESSION_STARTED_COOKIE = 'opticaai_session_started_at'
export const SESSION_LAST_ACTIVITY_COOKIE = 'opticaai_session_last_activity_at'

export function getSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
