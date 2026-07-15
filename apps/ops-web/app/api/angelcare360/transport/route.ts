import { NextRequest, NextResponse } from 'next/server'
import {
  blockAngelcare360TransportGps,
  blockAngelcare360TransportNotification,
  cancelAngelcare360TransportAssignment,
  changeAngelcare360TransportRouteStatus,
  changeAngelcare360TransportVehicleStatus,
  createAngelcare360TransportAssignment,
  createAngelcare360TransportRoute,
  createAngelcare360TransportStop,
  createAngelcare360TransportVehicle,
  getAngelcare360TransportNotificationReadiness,
  getAngelcare360TransportOverview,
  getAngelcare360TransportSafetyReadiness,
  listAngelcare360TransportAuditEvents,
  updateAngelcare360TransportAssignment,
  updateAngelcare360TransportRoute,
  updateAngelcare360TransportStop,
  updateAngelcare360TransportVehicle,
} from '@/lib/angelcare360/server/transport'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type TransportMutationBody = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: TransportMutationBody): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const mode = request.nextUrl.searchParams.get('mode') || 'overview'

  if (mode === 'audit') {
    const events = await listAngelcare360TransportAuditEvents({
      schoolId,
      filters: {
        module: request.nextUrl.searchParams.get('module'),
        action: request.nextUrl.searchParams.get('action'),
        severity: request.nextUrl.searchParams.get('severity'),
        entityType: request.nextUrl.searchParams.get('entityType'),
        entityId: request.nextUrl.searchParams.get('entityId'),
        actorUserId: request.nextUrl.searchParams.get('actorUserId'),
        status: request.nextUrl.searchParams.get('status'),
        search: request.nextUrl.searchParams.get('search'),
        from: request.nextUrl.searchParams.get('from'),
        to: request.nextUrl.searchParams.get('to'),
      },
    })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }

  if (mode === 'safety') {
    const safety = await getAngelcare360TransportSafetyReadiness({ schoolId })
    return NextResponse.json({ ok: true, safety }, { status: 200 })
  }

  if (mode === 'notifications') {
    const readiness = await getAngelcare360TransportNotificationReadiness({ schoolId })
    return NextResponse.json({ ok: true, readiness }, { status: 200 })
  }

  const overview = await getAngelcare360TransportOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as TransportMutationBody | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête transport est incomplète.' }, { status: 422 })
    }

    const payload = normalizePayload(body)

    if (body.entity === 'route') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360TransportRoute(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360TransportRoute(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360TransportRouteStatus(payload), { status: 200 })
    }

    if (body.entity === 'stop') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360TransportStop(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360TransportStop(payload), { status: 200 })
    }

    if (body.entity === 'vehicle') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360TransportVehicle(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360TransportVehicle(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360TransportVehicleStatus(payload), { status: 200 })
    }

    if (body.entity === 'assignment') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360TransportAssignment(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360TransportAssignment(payload), { status: 200 })
      if (body.operation === 'cancel') return NextResponse.json(await cancelAngelcare360TransportAssignment(payload), { status: 200 })
    }

    if (body.entity === 'notification' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360TransportNotification({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        entityType: typeof payload.entityType === 'string' ? payload.entityType : null,
        entityId: typeof payload.entityId === 'string' ? payload.entityId : null,
      }), { status: 200 })
    }

    if (body.entity === 'gps' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360TransportGps({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        entityType: typeof payload.entityType === 'string' ? payload.entityType : null,
        entityId: typeof payload.entityId === 'string' ? payload.entityId : null,
      }), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité transport inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

