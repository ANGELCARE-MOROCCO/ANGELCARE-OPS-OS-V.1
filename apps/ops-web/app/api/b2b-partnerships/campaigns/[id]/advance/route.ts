import { NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok:false, error:'Authentication required.' }, { status:401 })
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok:false, error:permission.error }, { status:permission.status })
    const { data: enrolled } = await db.from('b2b_campaign_prospects').select('*').eq('campaign_id', params.id).in('status', ['Enrolled','In Progress']).limit(100)
    let createdTasks = 0
    for (const row of enrolled || []) {
      const nextOrder = Number(row.current_step_order || 0) + 1
      await db.from('b2b_campaign_prospects').update({ current_step_order: nextOrder, status: 'In Progress', last_step_at: new Date().toISOString() }).eq('id', row.id)
      const { data: prospect } = await db.from('b2b_prospects').select('name,assigned_owner_id').eq('id', row.prospect_id).single()
      await db.from('b2b_tasks').insert({
        title: `Campaign step ${nextOrder}: ${prospect?.name || 'Prospect'}`,
        task_type: 'Campaign follow-up',
        prospect_id: row.prospect_id,
        assigned_to: prospect?.assigned_owner_id || actor.id,
        priority: 'High',
        status: 'To Do',
        description: `Execute next campaign sequence step for campaign ${params.id}.`,
        created_by: actor.id,
      })
      createdTasks++
    }
    return NextResponse.json({ ok:true, data:{ advanced: enrolled?.length || 0, created_tasks: createdTasks } })
  } catch (error) {
    console.error('[B2B_CAMPAIGN_ADVANCE_CRASHED]', error)
    return NextResponse.json({ ok:false, error:'Unable to advance campaign.' }, { status:500 })
  }
}
