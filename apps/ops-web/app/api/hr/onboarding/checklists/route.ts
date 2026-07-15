import { NextRequest, NextResponse } from 'next/server'
import { buildHRDomainLiveState } from '@/lib/hr-production/live-sync'
import { createClient } from '@/lib/supabase/server'
import { logHRActivity } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await buildHRDomainLiveState('onboarding'), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load Onboarding checklists state.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const action = String(body?.action || 'onboarding.review')
    const checklistId = String(body?.checklist_id || body?.id || '').trim()
    const taskId = String(body?.task_id || '').trim()
    const checklistPayload = {
      name: String(body?.name || body?.title || body?.checklist_title || 'Onboarding checklist').trim(),
      role_key: String(body?.role_key || body?.role || '').trim() || null,
      department_id: body?.department_id || null,
      stage: String(body?.stage || 'active').trim(),
      status: String(body?.status || 'active').trim(),
      checklist: Array.isArray(body?.checklist) ? body.checklist : Array.isArray(body?.items) ? body.items : [],
      notes: String(body?.notes || '').trim() || null,
      updated_at: new Date().toISOString(),
    }
    const taskPayload = {
      title: String(body?.title || body?.task_title || body?.name || 'Onboarding checklist item').trim(),
      staff_id: body?.staff_id || null,
      candidate_id: body?.candidate_id || null,
      category: String(body?.category || body?.group || 'general').trim(),
      stage: String(body?.stage || body?.step || 'preboarding').trim(),
      status: String(body?.status || 'pending').trim(),
      owner: String(body?.owner || body?.buddy_owner || body?.manager || '').trim() || null,
      due_date: body?.due_date || body?.due_at || null,
      completed_at: body?.completed_at || (String(body?.status || '').toLowerCase().includes('complete') ? new Date().toISOString() : null),
      notes: String(body?.notes || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    const useChecklistTable = Boolean(
      body?.checklist_id ||
      checklistId ||
      body?.name ||
      body?.checklist ||
      body?.items ||
      body?.role_key ||
      body?.department_id ||
      body?.checklist_template_id ||
      body?.template_id
    )
    const table = useChecklistTable ? 'hr_onboarding_checklists' : 'hr_onboarding_tasks'
    const identifier = useChecklistTable ? checklistId : taskId
    const payload = useChecklistTable ? checklistPayload : taskPayload
    const activityTitle = useChecklistTable ? checklistPayload.name : taskPayload.title

    let record: any = null
    if (identifier) {
      const { data, error } = await supabase.from(table).update(payload).eq('id', identifier).select('*').maybeSingle()
      if (error) throw error
      record = data
    } else {
      const { data, error } = await supabase.from(table).insert({ ...payload, created_at: new Date().toISOString() }).select('*').maybeSingle()
      if (error) throw error
      record = data
    }

    try {
      await supabase.from('hr_onboarding_activity').insert({
        onboarding_id: record?.onboarding_id || null,
        staff_id: record?.staff_id || null,
        candidate_id: record?.candidate_id || null,
        title: activityTitle,
        type: 'checklist_update',
        status: payload.status,
        notes: payload.notes,
        created_at: new Date().toISOString(),
      })
    } catch {}

    await logHRActivity({
      action: `hr.onboarding.${action}`,
      entity_type: useChecklistTable ? 'hr_onboarding_checklist' : 'hr_onboarding_task',
      entity_id: record?.id || identifier || null,
      module: 'hr',
      source: 'Onboarding checklists endpoint',
      status: 'recorded',
      severity: 'info',
      payload: { action, checklistId, taskId, table, body, record, payload },
      reason: 'Onboarding checklist mutation persisted to the live onboarding checklist layer.',
    })
    const state = await buildHRDomainLiveState('onboarding')
    return NextResponse.json({
      ok: true,
      endpoint: '/api/hr/onboarding',
      domain: 'onboarding',
      action,
      mutationApplied: true,
      table,
      message: 'Onboarding checklist mutation applied to the live onboarding checklist layer.',
      record,
      state,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to process Onboarding checklists action.' }, { status: 500 })
  }
}
