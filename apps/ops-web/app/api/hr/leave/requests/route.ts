import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { buildHRDomainLiveState } from '@/lib/hr-production/live-sync'
import { createClient } from '@/lib/supabase/server'
import { logHRActivity } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await buildHRDomainLiveState('leave'), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load Leave requests state.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const action = String(body?.action || body?.decision || body?.status || 'leave.review')
    const requestId = String(body?.request_id || body?.leave_id || body?.id || '').trim()
    const status = String(body?.status || body?.decision || 'pending').trim()
    const payload = {
      employee_name: String(body?.employee_name || body?.full_name || body?.name || 'Leave request').trim(),
      staff_id: body?.staff_id || null,
      department: String(body?.department || '').trim() || null,
      leave_type: String(body?.leave_type || body?.type || 'annual_leave').trim(),
      start_date: body?.start_date || null,
      end_date: body?.end_date || null,
      duration: body?.duration || body?.days || null,
      manager: String(body?.manager || body?.approver || '').trim() || null,
      status,
      approved_by: String(body?.approved_by || '').trim() || null,
      decision: String(body?.decision || '').trim() || null,
      decision_at: ['approved', 'rejected', 'declined'].includes(status.toLowerCase()) ? new Date().toISOString() : body?.decision_at || null,
      reason: String(body?.reason || body?.notes || '').trim() || null,
      notes: String(body?.notes || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    let record: any = null
    if (requestId) {
      const { data, error } = await supabase.from('hr_leave_requests').update(payload).eq('id', requestId).select('*').maybeSingle()
      if (error) throw error
      record = data
    } else {
      const { data, error } = await supabase.from('hr_leave_requests').insert({ ...payload, created_at: new Date().toISOString() }).select('*').maybeSingle()
      if (error) throw error
      record = data
    }

    try {
      await supabase.from('hr_approval_requests').insert({
        title: `${payload.employee_name} leave ${status}`,
        request_type: 'leave_request',
        entity_type: 'leave',
        entity_id: record?.id || requestId || null,
        requester_name: payload.employee_name,
        approver_name: payload.manager,
        status,
        priority: 'normal',
        notes: payload.notes,
        metadata: { action, payload },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch {}

    await logHRActivity({
      action: `hr.leave.${action}`,
      entity_type: 'hr_leave_request',
      entity_id: record?.id || requestId || null,
      module: 'hr',
      source: 'Leave requests endpoint',
      status: 'recorded',
      severity: 'info',
      payload: { action, requestId, body, record, payload },
      reason: 'Leave request mutation persisted to the live leave request table and approval trail.',
    })
    revalidatePath('/hr/approvals')
    revalidatePath('/hr/leave')
    revalidatePath('/hr/work-schedules')
    revalidatePath('/hr/rosters')
    revalidatePath('/hr')
    const state = await buildHRDomainLiveState('leave')
    return NextResponse.json({
      ok: true,
      endpoint: '/api/hr/leave',
      domain: 'leave',
      action,
      mutationApplied: true,
      message: 'Leave request mutation applied to the live leave table.',
      record,
      state,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to process Leave requests action.' }, { status: 500 })
  }
}
