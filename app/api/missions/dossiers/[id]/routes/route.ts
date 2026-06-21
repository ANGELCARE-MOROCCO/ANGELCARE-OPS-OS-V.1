import { NextResponse } from 'next/server'
import { getMissionDossier } from '@/lib/missions/repository'
import { patchMissionOrder } from '@/lib/missions/mission-order'
import { recordMissionEvent } from '@/lib/missions/events'

export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

function n(value: unknown) {
  const next = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(next) ? next : 0
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function asArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === 'object') as AnyRecord[] : []
}

function safeJson(value: unknown) {
  if (!value) return {}
  if (typeof value === 'object') return value as AnyRecord
  try { return JSON.parse(String(value)) } catch { return {} }
}

function pointPayload(row: AnyRecord, prefix: 'departure' | 'arrival') {
  return JSON.stringify({
    name: text(row[`${prefix}Name`] ?? row[`${prefix}_name`] ?? row[prefix]),
    zone: text(row[`${prefix}Zone`] ?? row[`${prefix}_zone`]),
    time: text(row[`${prefix}Time`] ?? row[`${prefix}_time`]),
    gps: {
      lat: text(row[`${prefix}Lat`] ?? row[`${prefix}_lat`]),
      lng: text(row[`${prefix}Lng`] ?? row[`${prefix}_lng`]),
    },
  })
}

function normalizeRoute(row: AnyRecord, index: number) {
  const metadata = {
    routeCode: text(row.routeCode ?? row.route_code) || `ROUTE-${Date.now()}-${index + 1}`,
    status: text(row.status) || 'draft',
    fulfillmentStatus: text(row.fulfillmentStatus ?? row.fulfillment_status) || 'planning',
    routeKind: text(row.routeKind ?? row.route_kind) || text(row.routeType ?? row.route_type) || 'direct',
    departureName: text(row.departureName ?? row.departure_name),
    departureZone: text(row.departureZone ?? row.departure_zone),
    departureTime: text(row.departureTime ?? row.departure_time),
    departureLat: text(row.departureLat ?? row.departure_lat),
    departureLng: text(row.departureLng ?? row.departure_lng),
    arrivalName: text(row.arrivalName ?? row.arrival_name),
    arrivalZone: text(row.arrivalZone ?? row.arrival_zone),
    arrivalTime: text(row.arrivalTime ?? row.arrival_time),
    arrivalLat: text(row.arrivalLat ?? row.arrival_lat),
    arrivalLng: text(row.arrivalLng ?? row.arrival_lng),
    primaryTransport: text(row.primaryTransport ?? row.primary_transport),
    transportDetails: text(row.transportDetails ?? row.transport_details),
    backupTransports: Array.isArray(row.backupTransports) ? row.backupTransports : text(row.backupTransport ?? row.backup_transport).split(',').map((item) => item.trim()).filter(Boolean),
    transits: Array.isArray(row.transits) ? row.transits : [],
    incidents: Array.isArray(row.incidents) ? row.incidents : [],
    incidentNote: text(row.incidentNote ?? row.incident_note),
    opsComment: text(row.opsComment ?? row.ops_comment),
    validationSummary: text(row.validationSummary ?? row.validation_summary),
    savedAt: new Date().toISOString(),
  }

  return {
    sort_order: index,
    route_type: metadata.routeKind || 'caregiver_travel',
    operation_label: `${metadata.routeCode} · ${metadata.departureName || 'Departure'} → ${metadata.arrivalName || 'Arrival'}`,
    outbound_departure: pointPayload(row, 'departure'),
    outbound_arrival: pointPayload(row, 'arrival'),
    return_departure: JSON.stringify({ transits: metadata.transits, primaryTransport: metadata.primaryTransport, transportDetails: metadata.transportDetails }),
    return_arrival: JSON.stringify({ backupTransports: metadata.backupTransports }),
    duration_label: text(row.durationLabel ?? row.duration_label) || `${metadata.departureTime || 'TBD'} → ${metadata.arrivalTime || 'TBD'}`,
    distance_label: text(row.distanceLabel ?? row.distance_label) || 'Operational distance pending live routing',
    cost_mad: n(row.costMad ?? row.cost_mad),
    notes: JSON.stringify(metadata),
  }
}

async function saveRoutes(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    if (!Number.isSafeInteger(missionId) || missionId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid mission dossier id.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({})) as AnyRecord
    const dossier: AnyRecord = await getMissionDossier(missionId) || {}
    const parentMissionId = Number(dossier?.parent?.id || dossier?.mission?.id || dossier?.raw?.id || missionId)
    const routes = asArray(body.routes).map(normalizeRoute)

    const result = await patchMissionOrder(parentMissionId, { routes })
    await recordMissionEvent({
      missionId: parentMissionId,
      eventType: 'mission_routes_synced',
      content: 'CareLink operational routes synced from Edit Route Studio',
      metadata: {
        requestedMissionId: missionId,
        routeCount: routes.length,
        scope: body.scope || 'selected_mission',
        validation: body.validation || {},
        summary: body.summary || {},
      },
      source: 'carelink_edit_route_studio',
    })

    const updated = await getMissionDossier(parentMissionId).catch(() => null)
    return NextResponse.json({ ok: true, data: { parentMissionId, requestedMissionId: missionId, routes, result, dossier: updated } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to sync mission routes.' }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return saveRoutes(request, context)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return saveRoutes(request, context)
}
