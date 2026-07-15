import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeTelemetryEvent, type OpsosTelemetryIngestPayload } from '@/lib/opsos-control-plane/telemetry-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_EVENTS_PER_REQUEST = 50

function toInsertRow(event: ReturnType<typeof normalizeTelemetryEvent>, source: string) {
  return {
    event_type: event.eventType,
    route: event.route || '/unknown',
    modal: event.modal || null,
    api_path: event.apiPath || null,
    interaction_name: event.interactionName || null,
    severity: event.severity || 'info',
    duration_ms: event.durationMs ?? null,
    memory_mb: event.memoryMb ?? null,
    session_id: event.sessionId || null,
    user_id: event.userId || null,
    user_agent: event.userAgent || null,
    payload: event.metadata || {},
    metadata: { ...(event.metadata || {}), source },
  }
}

export async function POST(request: Request) {
  const raw = (await request.json().catch(() => ({}))) as OpsosTelemetryIngestPayload
  const source = String(raw.source || 'client').slice(0, 40)
  const incoming = Array.isArray(raw.events) ? raw.events : raw.event ? [raw.event] : []
  const events = incoming.slice(0, MAX_EVENTS_PER_REQUEST).map((event) => normalizeTelemetryEvent(event))

  if (!events.length) {
    return NextResponse.json({ ok: true, accepted: 0, skipped: 'empty-payload' })
  }

  try {
    const supabase = await createClient()
    const rows = events.map((event) => toInsertRow(event, source))
    const result = await supabase.from('opsos_performance_events').insert(rows)

    if (result.error) {
      return NextResponse.json({ ok: false, accepted: 0, error: result.error.message }, { status: 202 })
    }

    return NextResponse.json({ ok: true, accepted: rows.length })
  } catch (error) {
    return NextResponse.json({ ok: false, accepted: 0, error: String(error) }, { status: 202 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: 'OPSOS telemetry ingest',
    acceptedEventTypes: [
      'route_mount',
      'route_navigation',
      'long_task',
      'memory_sample',
      'api_call',
      'api_error',
      'modal_open',
      'modal_close',
      'client_error',
      'unhandled_rejection',
      'interaction',
    ],
  })
}
