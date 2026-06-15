import { NextResponse } from 'next/server'
import { getMissionDossier } from '@/lib/missions/repository'
import { recordMissionEvent } from '@/lib/missions/events'
import { completeMissionChecklist, loadMissionChecklist, updateMissionChecklistItem } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const dossier = await getMissionDossier(Number(id))
    if (!dossier) return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 })
    const items = await loadMissionChecklist(Number(id), dossier.raw.service_type || dossier.mission.serviceType, dossier.raw.caregiver_id ? Number(dossier.raw.caregiver_id) : null)
    const required = items.filter((item) => item.required)
    const completed = items.filter((item) => item.completed)
    return NextResponse.json({
      ok: true,
      data: {
        items,
        summary: {
          total: items.length,
          required: required.length,
          completed: completed.length,
          progress: items.length ? Math.round((completed.length / items.length) * 100) : 0,
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Checklist load failed' }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({})) as {
      itemId?: string
      itemIds?: string[]
      completed?: boolean
      notes?: string
      metadata?: Record<string, unknown>
    }
    const missionId = Number(id)
    if (body.itemId) {
      const item = await updateMissionChecklistItem(body.itemId, {
        completed: body.completed ?? true,
        completedAt: body.completed === false ? null : new Date().toISOString(),
        notes: body.notes || null,
        metadata: body.metadata || {},
      })
      await recordMissionEvent({
        missionId,
        eventType: 'mobile_checklist_item_completed',
        content: body.notes || `Élément de checklist ${body.itemId} mis à jour`,
        metadata: { item_id: body.itemId, completed: body.completed ?? true, ...(body.metadata || {}) },
        source: 'carelink_mobile',
      })
      return NextResponse.json({ ok: true, data: item })
    }

    const items = await completeMissionChecklist(missionId, {
      itemIds: body.itemIds || [],
      notes: body.notes || undefined,
      metadata: body.metadata || {},
    })
    return NextResponse.json({ ok: true, data: items })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Checklist completion failed' }, { status: 500 })
  }
}
