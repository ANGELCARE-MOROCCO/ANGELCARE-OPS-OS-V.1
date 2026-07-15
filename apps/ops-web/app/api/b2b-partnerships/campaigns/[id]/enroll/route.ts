import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok:false, error:'Authentication required.' }, { status:401 })
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok:false, error:permission.error }, { status:permission.status })
    const body = await req.json()
    const prospectIds = Array.isArray(body.prospect_ids) ? body.prospect_ids.filter(Boolean) : []
    if (!prospectIds.length) return NextResponse.json({ ok:false, error:'No prospects selected.' }, { status:400 })
    const rows = prospectIds.map((prospect_id: string) => ({ campaign_id: params.id, prospect_id, status: 'Enrolled', current_step_order: 0 }))
    const { error } = await db.from('b2b_campaign_prospects').upsert(rows, { onConflict: 'campaign_id,prospect_id' })
    if (error) return NextResponse.json({ ok:false, error:'Unable to enroll prospects.' }, { status:500 })
    await db.from('b2b_campaigns').update({ enrolled_count: prospectIds.length, updated_at: new Date().toISOString() }).eq('id', params.id)
    await db.from('b2b_prospects').update({ campaign_status: 'Enrolled', last_campaign_touch_at: new Date().toISOString() }).in('id', prospectIds)
    return NextResponse.json({ ok:true, data:{ enrolled: prospectIds.length } })
  } catch (error) {
    console.error('[B2B_CAMPAIGN_ENROLL_CRASHED]', error)
    return NextResponse.json({ ok:false, error:'Unable to enroll prospects.' }, { status:500 })
  }
}
