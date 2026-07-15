import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { createClient } from '@/lib/supabase/server'
import { recordMissionEvent } from '@/lib/missions/events'
import { carelinkMobileErrorResponse, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    return NextResponse.json({ ok: true, data: workspace.profile || workspace.agent })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Unable to load CareLink profile')
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const workspace = await loadCarelinkMobileWorkspace()
    const current = workspace.profile || workspace.agent || null
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of ['full_name', 'phone', 'city', 'readiness_status', 'availability_status', 'skills', 'zones', 'languages', 'avatar_url', 'notes']) {
      if (body[key] !== undefined) patch[key] = body[key]
    }

    let data = current
    if (current?.id) {
      const supabase = await createClient()
      const response = await supabase.from('caregivers').update(patch).eq('id', current.id).select('*').maybeSingle()
      if (response.error) throw new Error(response.error.message)
      data = response.data || current
    }

    if (body.missionId) {
      await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions')
      await recordMissionEvent({
        missionId: Number(body.missionId),
        eventType: 'profile_update_requested',
        content: String(body.note || 'Mise à jour du profil demandée depuis CareLink mobile'),
        metadata: body,
        source: 'carelink_mobile',
      })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Profile update failed')
  }
}
