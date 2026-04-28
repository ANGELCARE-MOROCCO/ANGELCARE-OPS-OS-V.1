import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'

const PUBLIC_ROUTES = ['/login']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const token = req.cookies.get(APP_SESSION_COOKIE)?.value

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}