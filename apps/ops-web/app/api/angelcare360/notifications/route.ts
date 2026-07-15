import { NextRequest, NextResponse } from 'next/server'
import {
  archiveAngelcare360Notification,
  blockAngelcare360NotificationExternalChannel,
  createAngelcare360InternalNotification,
  getAngelcare360NotificationChannelReadiness,
  getAngelcare360NotificationOverview,
  listAngelcare360NotificationAuditEvents,
  listAngelcare360NotificationHistory,
  markAngelcare360NotificationRead,
} from '@/lib/angelcare360/server/notifications'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type Body = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: Body): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const mode = request.nextUrl.searchParams.get('mode') || 'overview'

  if (mode === 'audit') {
    const events = await listAngelcare360NotificationAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }

  if (mode === 'channels') {
    const readiness = await getAngelcare360NotificationChannelReadiness({ schoolId })
    return NextResponse.json({ ok: true, readiness }, { status: 200 })
  }

  if (mode === 'history') {
    const history = await listAngelcare360NotificationHistory({ schoolId })
    return NextResponse.json({ ok: true, history }, { status: 200 })
  }

  const overview = await getAngelcare360NotificationOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête notifications est incomplète.' }, { status: 422 })
    }
    const payload = normalizePayload(body)

    if (body.entity === 'notification') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360InternalNotification(payload), { status: 200 })
      if (body.operation === 'read') return NextResponse.json(await markAngelcare360NotificationRead(payload), { status: 200 })
      if (body.operation === 'archive') return NextResponse.json(await archiveAngelcare360Notification(payload), { status: 200 })
    }

    if (body.entity === 'externalChannel' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360NotificationExternalChannel({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        channel: typeof payload.channel === 'string' ? payload.channel : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
      }), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité notifications inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

