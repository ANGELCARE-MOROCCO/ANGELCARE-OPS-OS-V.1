import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { getMissionDossier } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { CARELINK_MOBILE_TABLES, completeMissionChecklist, loadMissionChecklist, updateMissionChecklistItem } from '@/lib/carelink/mobile-persistence'
import { buildCareLinkDynamicServiceChecklist } from '@/lib/carelink/mobile-service-checklists'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await requireCareLinkMobileMissionAccess(Number(id), 'can_submit_reports')
    const dossier = await getMissionDossier(Number(id))
    if (!dossier) return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 })
    const serviceType = dossier.raw.service_type || dossier.mission.serviceType
    const definition = buildCareLinkDynamicServiceChecklist({
      serviceType,
      serviceFamily: dossier.mission.serviceFamily || dossier.raw.service_family,
      missionScope: dossier.raw.mission_scope,
      riskLevel: dossier.mission.riskLevel || dossier.raw.risk_level,
    })
    const items = await loadMissionChecklist(Number(id), serviceType, session.caregiverId, dossier.raw as Record<string, unknown>)
    const required = items.filter((item) => item.required)
    const completed = items.filter((item) => item.completed)
    return NextResponse.json({
      ok: true,
      data: {
        items,
        definition,
        summary: {
          total: items.length,
          required: required.length,
          completed: completed.length,
          progress: items.length ? Math.round((completed.length / items.length) * 100) : 0,
        },
      },
    })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Checklist load failed')
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const missionId = Number(id)
    const session = await requireCareLinkMobileMissionAccess(missionId, 'can_submit_reports')
    const body = await request.json().catch(() => ({})) as {
      itemId?: string
      itemIds?: string[]
      completed?: boolean
      notes?: string
      metadata?: Record<string, unknown>
    }
    if (body.itemId) {
      const { data: row, error } = await session.supabase
        .from(CARELINK_MOBILE_TABLES.checklist)
.select('id, mission_id, caregiver_id, metadata')
        .eq('id', body.itemId)
        .maybeSingle()

      if (error || !row || Number((row as Record<string, unknown>).mission_id) !== missionId) {
        return NextResponse.json({ ok: false, error: 'Checklist item not found for this mission.', code: 'carelink_checklist_item_not_assigned' }, { status: 404 })
      }

      const itemCaregiverId = Number((row as Record<string, unknown>).caregiver_id)
      if (Number.isFinite(itemCaregiverId) && itemCaregiverId !== session.caregiverId) {
        return NextResponse.json({ ok: false, error: 'Checklist item is not assigned to this agent.', code: 'carelink_checklist_item_caregiver_mismatch' }, { status: 403 })
      }

      const existingMetadata = ((row as Record<string, unknown>).metadata || {}) as Record<string, unknown>
      const nextMetadata = {
        ...existingMetadata,
        ...(body.metadata || {}),
        service_checklist_source: 'carelink_mobile_p11',
        checked_by_caregiver_id: session.caregiverId,
        checked_at: body.completed === false ? null : new Date().toISOString(),
      }
      const item = await updateMissionChecklistItem(body.itemId, {
        completed: body.completed ?? true,
        completedAt: body.completed === false ? null : new Date().toISOString(),
        completedBy: body.completed === false ? null : String(session.caregiverId),
        notes: body.notes || null,
        metadata: nextMetadata,
      })
      await recordMissionEvent({
        missionId,
        eventType: 'mobile_checklist_item_completed',
        content: body.notes || `Élément de checklist ${body.itemId} mis à jour`,
        metadata: { item_id: body.itemId, completed: body.completed ?? true, caregiver_id: session.caregiverId, ...(body.metadata || {}) },
        source: 'carelink_mobile',
      })
      return NextResponse.json({ ok: true, data: item })
    }

    const items = await completeMissionChecklist(missionId, {
      itemIds: body.itemIds || [],
      notes: body.notes || undefined,
      caregiverId: session.caregiverId,
      metadata: { service_checklist_source: 'carelink_mobile_p11', ...(body.metadata || {}) },
    })
    return NextResponse.json({ ok: true, data: items })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Checklist completion failed')
  }
}
