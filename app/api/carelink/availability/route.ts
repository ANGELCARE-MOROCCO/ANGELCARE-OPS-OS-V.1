import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { recordMissionEvent } from '@/lib/missions/events'
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { missionId?: number; note?: string; availability?: string; source?: string; metadata?: Record<string, unknown> }
    const session = body.missionId
      ? await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions', request)
      : await requireCareLinkMobileAgent('can_view_missions', request)

    const payload = {
      caregiver_id: session.caregiverId,
      auth_user_id: String(session.user.id || ''),
      mission_id: body.missionId ? Number(body.missionId) : null,
      availability_status: String(body.availability || 'available'),
      note: body.note || 'Disponibilité mise à jour depuis CareLink mobile',
      source: body.source || 'carelink_mobile_availability',
      metadata: body.metadata || {},
    }

    const { data, error } = await session.supabase
      .from('carelink_agent_availability_updates')
      .insert([payload])
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)

    if (body.missionId) {
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'availability_updated',
        content: payload.note,
        metadata: { availability: payload.availability_status, update_id: data?.id || null },
        source: 'carelink_mobile',
      })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Availability update failed')
  }
}
