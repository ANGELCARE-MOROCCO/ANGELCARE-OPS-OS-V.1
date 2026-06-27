import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { recordMissionEvent } from '@/lib/missions/events'
import { recordCareLinkAgentActivity, recordCareLinkDispatchSlaSnapshot } from '@/lib/carelink/mobile-audit-ledger'
import { createNotification } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions', request)
    const workspace = await loadCarelinkMobileWorkspace()
    const { data } = await session.supabase
      .from('carelink_agent_availability_updates')
      .select('*')
      .eq('caregiver_id', session.caregiverId)
      .order('created_at', { ascending: false })
      .limit(80)

    return NextResponse.json({
      ok: true,
      data: {
        status: workspace.readiness.status === 'blocked' ? 'unavailable' : 'available',
        blocks: workspace.schedule.map((item) => ({ day: item.date, missions: item.missions.length })),
        readiness: workspace.readiness,
        stats: workspace.stats,
        updates: data || [],
      },
    })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load availability failed')
  }
}

function asArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean)
  return []
}

function asBool(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', 'yes', 'oui', '1', 'available', 'ready'].includes(value.toLowerCase())
  return null
}

function normalizeAvailability(value: unknown) {
  const status = String(value || 'available').trim().toLowerCase().replaceAll(' ', '_')
  if (['available', 'limited', 'unavailable', 'emergency_backup', 'day_off', 'blackout', 'transport_limited'].includes(status)) return status
  return 'available'
}

function normalizeAvailabilityType(value: unknown) {
  const type = String(value || 'status_update').trim().toLowerCase().replaceAll(' ', '_')
  if (['status_update', 'day_off_request', 'blackout_date', 'emergency_availability', 'weekend_availability', 'night_availability', 'transport_readiness', 'zone_preference'].includes(type)) return type
  return 'status_update'
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      missionId?: number
      note?: string
      availability?: string
      availabilityStatus?: string
      availabilityType?: string
      source?: string
      effectiveFrom?: string | null
      effectiveUntil?: string | null
      blackoutDate?: string | null
      dayPart?: string | null
      preferredZones?: unknown
      excludedZones?: unknown
      weekendAvailable?: boolean | string | null
      nightAvailable?: boolean | string | null
      emergencyAvailable?: boolean | string | null
      transportReady?: boolean | string | null
      conflictLevel?: string | null
      metadata?: Record<string, unknown>
    }
    const session = body.missionId
      ? await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions', request)
      : await requireCareLinkMobileAgent('can_view_missions', request)

    const payload = {
      caregiver_id: session.caregiverId,
      auth_user_id: String(session.user.id || ''),
      mission_id: body.missionId ? Number(body.missionId) : null,
      availability_status: normalizeAvailability(body.availabilityStatus || body.availability),
      availability_type: normalizeAvailabilityType(body.availabilityType),
      note: body.note || 'Disponibilité mise à jour depuis CareLink mobile',
      source: body.source || 'carelink_mobile_availability',
      effective_from: body.effectiveFrom || null,
      effective_until: body.effectiveUntil || null,
      blackout_date: body.blackoutDate || null,
      day_part: body.dayPart || null,
      preferred_zones: asArray(body.preferredZones),
      excluded_zones: asArray(body.excludedZones),
      weekend_available: asBool(body.weekendAvailable),
      night_available: asBool(body.nightAvailable),
      emergency_available: asBool(body.emergencyAvailable),
      transport_ready: asBool(body.transportReady),
      conflict_level: body.conflictLevel || null,
      metadata: { source: 'carelink_mobile_p14', ...(body.metadata || {}) },
    }

    const { data, error } = await session.supabase
      .from('carelink_agent_availability_updates')
      .insert([payload])
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)

    const auditWrites: Array<Promise<unknown>> = [
      recordCareLinkAgentActivity({
        caregiverId: session.caregiverId,
        userId: String(session.user.id || ''),
        missionId: body.missionId ? Number(body.missionId) : null,
        activityType: 'availability-roster-update',
        source: 'carelink_mobile',
        status: payload.availability_status,
        outcome: payload.conflict_level ? 'attention_required' : 'recorded',
        priority: payload.conflict_level ? 'high' : 'normal',
        request,
        metadata: { availability_update_id: data?.id || null, availability_type: payload.availability_type, conflict_level: payload.conflict_level },
      }),
      createNotification({
        caregiverId: session.caregiverId,
        missionId: body.missionId ? Number(body.missionId) : null,
        type: 'availability_roster_updated',
        title: 'Disponibilité synchronisée',
        body: payload.note,
        priority: payload.conflict_level ? 'high' : 'normal',
        linkedEntityType: 'agent_availability_update',
        linkedEntityId: data?.id || null,
        metadata: { availability_status: payload.availability_status, availability_type: payload.availability_type, conflict_level: payload.conflict_level },
      }),
    ]

    if (body.missionId) {
      auditWrites.push(recordCareLinkDispatchSlaSnapshot({
        missionId: Number(body.missionId),
        caregiverId: session.caregiverId,
        actionType: payload.conflict_level ? 'availability_conflict' : 'availability_update',
        mission: null,
        previousMission: null,
        source: 'carelink_mobile',
        metadata: { availability_update_id: data?.id || null, availability_status: payload.availability_status, availability_type: payload.availability_type },
      }))
    }

    await Promise.allSettled(auditWrites)

    if (body.missionId) {
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'availability_updated',
        content: payload.note,
        metadata: { availability: payload.availability_status, availability_type: payload.availability_type, update_id: data?.id || null },
        source: 'carelink_mobile',
      })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Availability update failed')
  }
}
