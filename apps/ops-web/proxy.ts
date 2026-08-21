import { consumeAngelCareGlobalBurstToken } from '@/lib/runtime/governor/burst'
import { NextResponse, type NextRequest } from 'next/server'

function hasCookie(request: NextRequest, names: string[]) {
  return names.some((name) => Boolean(request.cookies.get(name)?.value))
}

function hasCareLinkMobileSession(request: NextRequest) {
  return hasCookie(request, [
    'carelink_mobile_session',
    'carelink_mobile_token',
    'carelink_agent_session',
    'carelink_agent_token',
    'carelink_session',
    'carelink_token',
    'sb-access-token',
    'supabase-auth-token',
  ])
}

function hasCareLinkOpsSession(request: NextRequest) {
  return hasCookie(request, [
    'opsos_session',
    'opsos_token',
    'angelcare_session',
    'angelcare_token',
    'app_session',
    'app_token',
    'angelcare_ops_session',
    'sb-access-token',
    'supabase-auth-token',
  ])
}

function isCareLinkOpsAuthorizedActor(request: NextRequest) {
  return hasCareLinkOpsSession(request)
}

function isCareLinkOpsProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/carelink-ops') ||
    pathname.startsWith('/carelink/ops') ||
    pathname.startsWith('/api/carelink/ops') ||
    pathname.startsWith('/api/carelink/admin')
  )
}

function isCareLinkMobilePublicPath(pathname: string) {
  return (
    pathname === '/carelink/login' ||
    pathname.startsWith('/carelink/login/') ||
    pathname === '/carelink/mobile-login' ||
    pathname.startsWith('/carelink/mobile-login/') ||
    pathname === '/api/carelink/login' ||
    pathname.startsWith('/api/carelink/login/') ||
    pathname === '/api/carelink/mobile-login' ||
    pathname.startsWith('/api/carelink/mobile-login/') ||
    pathname === '/api/carelink/auth' ||
    pathname.startsWith('/api/carelink/auth/')
  )
}

function isCareLinkMobileProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/carelink') &&
    !pathname.startsWith('/carelink-ops') &&
    !pathname.startsWith('/carelink/ops') &&
    !isCareLinkMobilePublicPath(pathname)
  )
}

function redirectWithNext(request: NextRequest, pathname: string) {
  const url = new URL(pathname, request.url)
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

function buildCareLinkMobileLoginRequiredResponse(request: NextRequest) {
  return redirectWithNext(request, '/carelink/login')
}

export function proxy(request: NextRequest) {

  const angelcareBurst =
    consumeAngelCareGlobalBurstToken(
      request.nextUrl.pathname,
      request.method,
    )

  if (!angelcareBurst.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Request burst capacity is temporarily saturated.',
        code: 'ANGELCARE_GLOBAL_BURST_SATURATED',
        retryAfterMs: angelcareBurst.retryAfterMs,
      },
      {
        status: 429,
        headers: {
          'cache-control': 'no-store',
          'retry-after': String(
            Math.max(
              1,
              Math.ceil(angelcareBurst.retryAfterMs / 1_000),
            ),
          ),
          'x-angelcare-burst-shield': 'active',
        },
      },
    )
  }

  const pathname = request.nextUrl.pathname

  if (isCareLinkOpsProtectedPath(pathname)) {
    if (!isCareLinkOpsAuthorizedActor(request)) {
      return redirectWithNext(request, '/login')
    }

    return NextResponse.next()
  }

  if (isCareLinkMobilePublicPath(pathname)) {
    if (
      (pathname === '/carelink/login' ||
        pathname.startsWith('/carelink/login/') ||
        pathname === '/carelink/mobile-login' ||
        pathname.startsWith('/carelink/mobile-login/')) &&
      hasCareLinkMobileSession(request)
    ) {
      return NextResponse.redirect(new URL('/carelink', request.url))
    }

    return NextResponse.next()
  }

  if (isCareLinkMobileProtectedPath(pathname)) {
    if (!hasCareLinkMobileSession(request)) {
      return buildCareLinkMobileLoginRequiredResponse(request)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/carelink/:path*',
    '/carelink-ops/:path*',
    '/api/carelink/:path*',
    '/api/connect/:path*',
  ],
}
