import { NextResponse, type NextRequest } from 'next/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname


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
