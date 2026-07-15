import { jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
import {
  REFFERQ_COOKIE_NAMES,
  REFFERQ_DATABASE_UNAVAILABLE_MESSAGE,
  getRefferqJwtSecret,
  isRefferqDatabaseConfigured,
} from '@refferq/lib/env'
import { getSupabaseEnv } from '@/lib/supabase/env'
import {
  buildSafeDisabledResponse,
  getRuntimeModuleForPath,
  getSupabaseRuntimeClientFromRequest,
  isCoreRouteAllowed,
  isPublicSystemPath,
  isStaticAssetPath,
  isSystemControlPath,
  isSystemRuntimeAuthorizedActor,
  loadRuntimeState,
  refreshRuntimeStateFromSchedule,
  shouldBlockRouteForDisabledModule,
} from '@/lib/system-control/runtime'

const REFFERQ_API_PREFIX = '/api/market-os/refferq'
const REFFERQ_APP_PREFIX = '/market-os/ambassadors/refferq'

const DB_EXEMPT_API_PATHS = new Set([
  `${REFFERQ_API_PREFIX}`,
  `${REFFERQ_API_PREFIX}/docs`,
  `${REFFERQ_API_PREFIX}/auth/me`,
  `${REFFERQ_API_PREFIX}/auth/logout`,
  `${REFFERQ_API_PREFIX}/affiliate/branding`,
])

function isRefferqRoute(pathname: string) {
  return pathname.startsWith(REFFERQ_API_PREFIX) || pathname.startsWith(REFFERQ_APP_PREFIX)
}

async function verifyRefferqToken(token: string | undefined | null) {
  const secret = getRefferqJwtSecret()
  if (!token || !secret) return null

  try {
    const result = await jwtVerify(token, new TextEncoder().encode(secret))
    const payload = result.payload as Record<string, any>
    return {
      id: String(payload.sub || ''),
      email: String(payload.email || ''),
      name: String(payload.name || ''),
      role: String(payload.role || 'AFFILIATE'),
      hasAffiliate: Boolean(payload.hasAffiliate),
    }
  } catch {
    return null
  }
}

async function handleRefferqRoute(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith(REFFERQ_API_PREFIX) && !isRefferqDatabaseConfigured() && !DB_EXEMPT_API_PATHS.has(pathname)) {
    return NextResponse.json(
      { ok: false, error: REFFERQ_DATABASE_UNAVAILABLE_MESSAGE },
      { status: 503 }
    )
  }

  const headers = new Headers(request.headers)
  const token = request.cookies.get(REFFERQ_COOKIE_NAMES.token)?.value || null
  const session = await verifyRefferqToken(token)

  if (session?.id) {
    headers.set('x-user-id', session.id)
    headers.set('x-user-email', session.email)
    headers.set('x-user-name', session.name)
    headers.set('x-user-role', session.role)
    headers.set('x-angelcare-email', session.email)
    headers.set('x-angelcare-role', session.role)
  }

  return NextResponse.next({
    request: {
      headers,
    },
  })
}

async function getRuntimeActorFromRequest(request: NextRequest) {
  const token = request.cookies.get(APP_SESSION_COOKIE)?.value
  if (!token) return null

  const supabase = getSupabaseRuntimeClientFromRequest(request)
  const { data: session } = await supabase
    .from('app_sessions')
    .select('user_id, expires_at')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session?.user_id) return null

  const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', session.user_id)
    .maybeSingle()

  if (!user) return null

  return {
    id: user.id ? String(user.id) : null,
    email: String(user.email || user.work_email || user.username || user.login || '').trim().toLowerCase() || null,
    role: String(user.role || user.role_key || '').trim().toLowerCase() || null,
    permissions: Array.isArray(user.permissions) ? user.permissions.map(String) : [],
  }
}


function isCareLinkOpsProtectedPath(pathname: string) {
  return pathname === '/carelink-ops' || pathname.startsWith('/carelink-ops/') || pathname.startsWith('/api/carelink/ops') || pathname.startsWith('/api/carelink-ops')
}

function isCareLinkMobilePublicPath(pathname: string) {
  return pathname === '/carelink/login' || pathname.startsWith('/carelink/login/') || pathname === '/api/carelink/health'
}

function isCareLinkMobileProtectedPath(pathname: string) {
  if (isCareLinkMobilePublicPath(pathname)) return false
  if (pathname === '/carelink' || pathname.startsWith('/carelink/')) return true
  if (pathname.startsWith('/api/carelink/') && !pathname.startsWith('/api/carelink/ops')) return true
  return false
}

function isCareLinkOpsAuthorizedActor(actor: Awaited<ReturnType<typeof getRuntimeActorFromRequest>>) {
  if (!actor) return false
  const role = String(actor.role || '').trim().toLowerCase()
  const permissions = Array.isArray(actor.permissions) ? actor.permissions.map(String) : []
  if (['ceo', 'owner', 'super_admin', 'direction', 'admin', 'operations', 'session_leader'].includes(role)) return true
  if (permissions.includes('*')) return true
  return [
    'operations.view',
    'operations.manage',
    'interventions.dispatch',
    'interventions.manage',
    'missions.view',
    'missions.assign',
    'caregivers.view',
  ].some((permission) => permissions.includes(permission))
}

function buildCareLinkAccessDeniedResponse(request: NextRequest, reason: string, status = 403) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: reason, code: 'carelink_ops_access_denied' }, { status })
  }
  return NextResponse.redirect(new URL(status === 401 ? '/login' : '/unauthorized', request.url))
}

function buildCareLinkMobileLoginRequiredResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'CareLink Mobile login required.', code: 'carelink_mobile_login_required' }, { status: 401 })
  }
  const loginUrl = new URL('/carelink/login', request.url)
  loginUrl.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isRefferqRoute(pathname)) {
    return handleRefferqRoute(request)
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.SYSTEM_CONTROL_BYPASS_LOCAL === '1' &&
    !pathname.startsWith('/api/system-control') &&
    !pathname.startsWith('/ceo/system-control')
  ) {
    return NextResponse.next()
  }


  const isSystemControlPlane =
    pathname === '/ceo/system-control' ||
    pathname.startsWith('/ceo/system-control/') ||
    pathname.startsWith('/api/system-control')

  if (isSystemControlPlane) {
    return NextResponse.next()
  }

  if (isStaticAssetPath(pathname) || isPublicSystemPath(pathname)) {
    return NextResponse.next()
  }

  const env = getSupabaseEnv()
  if (!env.url || !env.serviceRoleKey) {
    return NextResponse.next()
  }


  if (isCareLinkOpsProtectedPath(pathname)) {
    const actor = await getRuntimeActorFromRequest(request)
    if (!actor) return buildCareLinkAccessDeniedResponse(request, 'CareLink OPS login required.', 401)
    if (!isCareLinkOpsAuthorizedActor(actor)) return buildCareLinkAccessDeniedResponse(request, 'CareLink OPS access denied.', 403)
  }

  if (isCareLinkMobileProtectedPath(pathname)) {
    const actor = await getRuntimeActorFromRequest(request)
    if (!actor) return buildCareLinkMobileLoginRequiredResponse(request)
  }

  const supabase = getSupabaseRuntimeClientFromRequest(request)
  let state = await loadRuntimeState(supabase)
  state = await refreshRuntimeStateFromSchedule(supabase, state)

  if (isSystemControlPath(pathname)) {
    const actor = await getRuntimeActorFromRequest(request)
    if (!actor || !isSystemRuntimeAuthorizedActor(actor, state)) {
      const hardBlockedModes = new Set(['shutdown_in_progress', 'standby', 'restore_in_progress', 'emergency_lock'])

      if (pathname.startsWith('/api/')) {
        return buildSafeDisabledResponse({
          pathname,
          method: request.method,
          reason: 'System control access denied.',
          mode: state.mode,
          resumeAt: state.resumeAt,
        })
      }

      if (!state.isSystemOnline || hardBlockedModes.has(state.mode)) {
        return NextResponse.redirect(new URL('/system-offline', request.url))
      }

      return NextResponse.next()
    }

    return NextResponse.next()
  }

  const actor = await getRuntimeActorFromRequest(request)
  const hardBlockedModes = new Set(['shutdown_in_progress', 'standby', 'restore_in_progress', 'emergency_lock'])
  const systemBlocked = !state.isSystemOnline || hardBlockedModes.has(state.mode)
  const moduleBlocked = shouldBlockRouteForDisabledModule(pathname, state)

  if (!systemBlocked && !moduleBlocked) {
    return NextResponse.next()
  }

  if (actor && isSystemRuntimeAuthorizedActor(actor, state) && isCoreRouteAllowed(pathname, state, actor)) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const moduleKey = getRuntimeModuleForPath(pathname)
    return buildSafeDisabledResponse({
      pathname,
      method: request.method,
      reason: moduleBlocked ? `Module ${moduleKey || 'unknown'} is currently disabled.` : state.reason,
      mode: state.mode,
      resumeAt: state.resumeAt,
    })
  }

  return NextResponse.redirect(new URL('/system-offline', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
