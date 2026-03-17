import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import {
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_IDLE_TTL_MS,
  SESSION_LAST_ACTIVITY_COOKIE,
  SESSION_STARTED_COOKIE,
  getSessionCookieOptions,
} from '@/lib/auth/session'
import type { Database } from '@/types/database.types'

const protectedPrefixes = ['/admin', '/cuenta', '/dashboard']
const authPages = new Set([
  '/login',
  '/registro',
  '/recuperar-contrasena',
  '/restablecer-contrasena',
])

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  return response
}

function applySupabaseCookies(target: NextResponse, source: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })

  return target
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          supabaseResponse = NextResponse.next({
            request,
          })

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          } catch {
            // Middleware should keep going even if cookie writes fail unexpectedly.
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const sessionStartedAt = request.cookies.get(SESSION_STARTED_COOKIE)?.value
  const sessionLastActivityAt = request.cookies.get(SESSION_LAST_ACTIVITY_COOKIE)?.value
  if (user && !sessionStartedAt) {
    const now = String(Date.now())
    supabaseResponse.cookies.set(
      SESSION_STARTED_COOKIE,
      now,
      getSessionCookieOptions(Math.floor(SESSION_ABSOLUTE_TTL_MS / 1000))
    )
    supabaseResponse.cookies.set(
      SESSION_LAST_ACTIVITY_COOKIE,
      now,
      getSessionCookieOptions(Math.floor(SESSION_IDLE_TTL_MS / 1000))
    )
  }

  if (user && sessionStartedAt) {
    const startedAtMs = Number(sessionStartedAt)
    const lastActivityMs = Number(sessionLastActivityAt)
    const now = Date.now()
    const isAbsoluteExpired =
      Number.isFinite(startedAtMs) && now - startedAtMs > SESSION_ABSOLUTE_TTL_MS
    const isIdleExpired =
      Number.isFinite(lastActivityMs) && now - lastActivityMs > SESSION_IDLE_TTL_MS

    if (isAbsoluteExpired || isIdleExpired) {
      await supabase.auth.signOut()

      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('expired', 'true')
      redirectUrl.searchParams.set('redirectTo', pathname)

      const expiredResponse = applySupabaseCookies(
        NextResponse.redirect(redirectUrl),
        supabaseResponse
      )
      expiredResponse.cookies.delete(SESSION_STARTED_COOKIE)
      expiredResponse.cookies.delete(SESSION_LAST_ACTIVITY_COOKIE)
      return applySecurityHeaders(expiredResponse)
    }

    supabaseResponse.cookies.set(
      SESSION_LAST_ACTIVITY_COOKIE,
      String(now),
      getSessionCookieOptions(Math.floor(SESSION_IDLE_TTL_MS / 1000))
    )
  }

  if (!user) {
    supabaseResponse.cookies.delete(SESSION_STARTED_COOKIE)
    supabaseResponse.cookies.delete(SESSION_LAST_ACTIVITY_COOKIE)
  }

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)

    return applySecurityHeaders(
      applySupabaseCookies(NextResponse.redirect(redirectUrl), supabaseResponse)
    )
  }

  if (user && authPages.has(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = isAdminPath(pathname) ? '/admin' : '/dashboard'
    return applySecurityHeaders(
      applySupabaseCookies(NextResponse.redirect(redirectUrl), supabaseResponse)
    )
  }

  if (user && isAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return applySecurityHeaders(
        applySupabaseCookies(NextResponse.redirect(redirectUrl), supabaseResponse)
      )
    }
  }

  return applySecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
