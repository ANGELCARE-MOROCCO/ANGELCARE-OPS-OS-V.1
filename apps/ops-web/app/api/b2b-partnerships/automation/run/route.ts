import { NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function POST() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok:false, error:'Authentication required.' }, { status:401 })
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok:false, error:permission.error }, { status:permission.status })
    const { data: rules } = await db.from('b2b_automation_rules').select('*').eq('is_active', true)
    let createdTasks = 0
    const fiveDaysAgo = new Date(); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const { data: priorityA } = await db.from('b2b_prospects').select('*').eq('priority_score','A').is('archived_at', null).limit(100)
    for (const p of priorityA || []) {
      if (!p.last_contact_at || new Date(p.last_contact_at).getTime() < fiveDaysAgo.getTime()) {
        await db.from('b2b_tasks').insert({ title:`Relancer priorité A: ${p.name}`, task_type:'Automation follow-up', prospect_id:p.id, assigned_to:p.assigned_owner_id || actor.id, priority:'High', status:'To Do', description:'Automation: Priority A prospect requires follow-up discipline.', created_by:actor.id })
        createdTasks++
      }
    }
    await db.from('b2b_automation_rules').update({ last_run_at: new Date().toISOString() }).eq('is_active', true)
    return NextResponse.json({ ok:true, data:{ active_rules: rules?.length || 0, created_tasks: createdTasks } })
  } catch (error) {
    console.error('[B2B_AUTOMATION_RUN_CRASHED]', error)
    return NextResponse.json({ ok:false, error:'Unable to run automation rules.' }, { status:500 })
  }
}
