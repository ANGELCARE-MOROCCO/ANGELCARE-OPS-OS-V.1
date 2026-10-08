import { NextResponse } from 'next/server'
import { APP_SESSION_COOKIE, APP_SESSION_COOKIE_DOMAIN } from '@/lib/auth/session'
import {
  adminSessionMaxAge,
  assertAdminLoginSameOrigin,
  authenticateMarketplaceAdmin,
} from '@/angelcare-marketplace/auth/admin/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!assertAdminLoginSameOrigin(request)) {
    return NextResponse.json({ ok: false, message: 'Origine de connexion refusée.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, message: 'Requête de connexion invalide.' }, { status: 400 })
  }

  try {
    const result = await authenticateMarketplaceAdmin({
      identifier: body.identifier,
      password: body.password,
      returnTo: body.returnTo,
      request,
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, code: result.code, message: result.message }, { status: result.status })
    }

    const response = NextResponse.json({
      ok: true,
      returnTo: result.returnTo,
      displayName: result.displayName,
    })
    // Remove the legacy host-only session before issuing the shared session.
    response.cookies.set(APP_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    response.cookies.set(APP_SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(APP_SESSION_COOKIE_DOMAIN
        ? { domain: APP_SESSION_COOKIE_DOMAIN }
        : {}),
      maxAge: adminSessionMaxAge(result.expiresAt),
    })
    response.headers.set('cache-control', 'no-store')
    return response
  } catch {
    return NextResponse.json({ ok: false, message: 'Connexion administrateur momentanément indisponible.' }, { status: 500 })
  }
}
