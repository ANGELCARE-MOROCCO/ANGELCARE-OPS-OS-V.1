import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { recordMissionEvent } from '@/lib/missions/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    return NextResponse.json({ ok: true, data: workspace.profile || workspace.agent })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load CareLink profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const supabase = await createClient()
    const workspace = await loadCarelinkMobileWorkspace()
    const current = workspace.profile || workspace.agent || null
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of ['full_name', 'phone', 'city', 'status', 'readiness_status', 'availability_status', 'skills', 'zones', 'languages', 'avatar_url', 'notes']) {
      if (body[key] !== undefined) patch[key] = body[key]
    }

    let data = current
    if (current?.id) {
      const response = await supabase.from('caregivers').update(patch).eq('id', current.id).select('*').maybeSingle()
      if (response.error) throw new Error(response.error.message)
      data = response.data || current
    }

    if (body.missionId) {
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
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Profile update failed' }, { status: 500 })
  }
}
