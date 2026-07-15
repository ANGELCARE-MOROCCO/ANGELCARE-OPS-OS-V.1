import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { APP_ROUTES } from '@/lib/generated/app-routes'

type RoutePressureRow = {
  route: string
  label: string
  group: string
  type: 'page' | 'api' | 'workspace' | 'system'
  risk: 'normal' | 'elevated' | 'high' | 'critical'
  pressureScore: number
  reason: string
  lastEventAt: string | null
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function routeGroup(href: string) {
  if (href.includes('ceo')) return 'CEO System'
  if (href.includes('carelink')) return 'CareLink Ops'
  if (href.includes('email')) return 'Email OS'
  if (href.includes('capital')) return 'Capital Command'
  if (href.includes('revenue')) return 'Revenue'
  if (href.includes('b2b')) return 'B2B'
  if (href.includes('academy')) return 'Academy'
  if (href.includes('hr')) return 'HR'
  if (href.includes('dashboard')) return 'My Space'
  if (href.includes('api')) return 'API'
  return 'Workspace'
}

function routeType(href: string): RoutePressureRow['type'] {
  if (href.startsWith('/api')) return 'api'
  if (href.includes('workspace')) return 'workspace'
  if (href.includes('ceo') || href.includes('system-control')) return 'system'
  return 'page'
}

function baseRisk(href: string): RoutePressureRow['risk'] {
  const criticalSignals = [
    'auth',
    'login',
    'ceo',
    'system-control',
    'shutdown',
    'restore',
    'payment',
    'payments',
    'delete',
    'users',
    'attendance',
    'mission',
    'dispatch',
    'email-os',
  ]

  const highSignals = ['capital', 'revenue', 'carelink', 'b2b', 'hr', 'academy']

  if (criticalSignals.some((signal) => href.toLowerCase().includes(signal))) return 'high'
  if (highSignals.some((signal) => href.toLowerCase().includes(signal))) return 'elevated'
  return 'normal'
}

function scoreForRisk(risk: RoutePressureRow['risk']) {
  if (risk === 'critical') return 95
  if (risk === 'high') return 78
  if (risk === 'elevated') return 55
  return 24
}

function nextRisk(base: RoutePressureRow['risk'], eventCount: number): RoutePressureRow['risk'] {
  if (eventCount >= 8) return 'critical'
  if (eventCount >= 4) return 'high'
  if (eventCount >= 1 && base === 'normal') return 'elevated'
  return base
}

export async function GET() {
  const supabase = supabaseAdmin()

  try {
    const routes = Array.isArray(APP_ROUTES) ? APP_ROUTES : []
    let runtimeEvents: any[] = []

    if (supabase) {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()

      const { data } = await supabase
        .from('system_runtime_events')
        .select('event_type,severity,route,module_key,message,created_at,metadata')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(300)

      runtimeEvents = Array.isArray(data) ? data : []
    }

    const rows: RoutePressureRow[] = routes
      .map((route: any) => {
        const href = String(route.href || route.path || route.route || '').trim()
        if (!href || href === '#') return null

        const relatedEvents = runtimeEvents.filter((event) => {
          const eventRoute = String(event.route || event.metadata?.route || '').toLowerCase()
          const message = String(event.message || '').toLowerCase()
          const key = href.toLowerCase()
          return eventRoute === key || message.includes(key) || key.includes(String(event.module_key || '').toLowerCase())
        })

        const base = baseRisk(href)
        const risk = nextRisk(base, relatedEvents.length)
        const pressureScore = Math.min(100, scoreForRisk(risk) + relatedEvents.length * 4)

        return {
          route: href,
          label: String(route.label || route.title || href),
          group: routeGroup(href),
          type: routeType(href),
          risk,
          pressureScore,
          reason:
            relatedEvents.length > 0
              ? `${relatedEvents.length} runtime event(s) detected in the last 24h.`
              : risk === 'normal'
                ? 'No pressure signal detected from internal runtime events.'
                : 'Sensitive route category. Monitor access, errors and runtime events.',
          lastEventAt: relatedEvents[0]?.created_at || null,
        }
      })
      .filter(Boolean) as RoutePressureRow[]

    const sorted = rows.sort((a, b) => b.pressureScore - a.pressureScore)

    const summary = {
      routes: rows.length,
      apiRoutes: rows.filter((row) => row.type === 'api').length,
      protectedRoutes: rows.filter((row) => row.route.includes('(protected)') || row.route.includes('dashboard') || row.route.includes('ceo')).length,
      critical: rows.filter((row) => row.risk === 'critical').length,
      high: rows.filter((row) => row.risk === 'high').length,
      elevated: rows.filter((row) => row.risk === 'elevated').length,
      normal: rows.filter((row) => row.risk === 'normal').length,
      providerTelemetry:
        process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID
          ? 'configured'
          : 'not_configured',
      source: supabase ? 'internal_runtime_events_and_route_registry' : 'route_registry_only',
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      ok: true,
      summary,
      rows: sorted.slice(0, 80),
      top: sorted.slice(0, 12),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Unable to calculate route pressure.',
      },
      { status: 500 },
    )
  }
}
