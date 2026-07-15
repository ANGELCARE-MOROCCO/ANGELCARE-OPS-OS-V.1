import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { requireRole } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type ActivityPayload = {
  eventType?: string
  routeHref?: string
  moduleKey?: string
  referrer?: string
  screenSize?: string
  timezone?: string
  language?: string
  deviceType?: string
  browserName?: string
  osName?: string
  sessionId?: string
  payload?: Record<string, unknown>
}

function clean(value: unknown) {
  const text = String(value || '').trim()
  return text.length ? text.slice(0, 600) : null
}

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || null
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    null
  )
}

function moduleFromRoute(routeHref: string | null) {
  if (!routeHref) return null
  const first = routeHref.split('?')[0]?.split('/').filter(Boolean)[0]
  return first || 'home'
}

export async function GET(request: NextRequest) {
  await requireRole(['ceo', 'manager', 'admin', 'hr_admin', 'hr_manager', 'operations_manager'])

  const searchParams = request.nextUrl.searchParams
  const userId = clean(searchParams.get('userId'))
  const email = clean(searchParams.get('email'))
  const limitRaw = Number(searchParams.get('limit') || 250)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 250

  const supabase = await createClient()
  let query = supabase
    .from('app_user_activity_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (userId) query = query.eq('user_id', userId)
  if (email) query = query.eq('email', email)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, events: [] }, { status: 500 })
  }

  return NextResponse.json({ ok: true, events: data || [] })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as ActivityPayload
  const routeHref = clean(body.routeHref) || '/'
  const eventType = clean(body.eventType) || 'page_view'
  const moduleKey = clean(body.moduleKey) || moduleFromRoute(routeHref)
  const userAgent = request.headers.get('user-agent') || clean(body.payload?.userAgent)

  const row = {
    user_id: String(user.id),
    email: clean(user.email),
    full_name: clean(user.full_name || user.name || user.display_name),
    role: clean(user.role),
    event_type: eventType,
    module_key: moduleKey,
    route_href: routeHref,
    ip_address: clientIp(request),
    user_agent: clean(userAgent),
    device_type: clean(body.deviceType),
    browser_name: clean(body.browserName),
    os_name: clean(body.osName),
    session_id: clean(body.sessionId),
    referrer: clean(body.referrer),
    screen_size: clean(body.screenSize),
    timezone: clean(body.timezone),
    language: clean(body.language),
    payload: {
      ...(body.payload || {}),
      capturedBy: 'protected-layout-client-tracker',
    },
  }

  const supabase = await createClient()
  const { error } = await supabase.from('app_user_activity_events').insert(row)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
