import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { buildHRDomainLiveState } from '@/lib/hr-production/live-sync'
import { createClient } from '@/lib/supabase/server'
import { logHRActivity } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await buildHRDomainLiveState('recruitment'), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load Recruitment pipeline state.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const action = String(body?.action || 'recruitment.review')
    const candidateId = String(body?.candidate_id || body?.candidateId || body?.id || '').trim()
    const stage = String(body?.stage || body?.pipeline_stage || '').trim() || null
    const status = String(body?.status || '').trim() || null
    const decision = String(body?.decision || '').trim() || null
    const payload = {
      full_name: String(body?.full_name || body?.candidate_name || body?.name || '').trim(),
      phone: String(body?.phone || '').trim() || null,
      email: String(body?.email || '').trim() || null,
      city: String(body?.city || '').trim() || null,
      source: String(body?.source || body?.candidate_source || 'recruitment_pipeline').trim(),
      job_id: String(body?.job_id || body?.opening_id || '').trim() || null,
      desired_position: String(body?.desired_position || body?.position || '').trim() || null,
      pipeline_stage: stage || 'screening',
      score: Number.isFinite(Number(body?.score)) ? Number(body.score) : 0,
      expected_salary: Number.isFinite(Number(body?.expected_salary)) ? Number(body.expected_salary) : 0,
      availability_date: body?.availability_date || null,
      interview_date: body?.interview_date || null,
      decision: decision || 'pending',
      notes: String(body?.notes || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    let record: any = null
    if (candidateId) {
      const { data, error } = await supabase.from('hr_candidates').update(payload).eq('id', candidateId).select('*').maybeSingle()
      if (error) throw error
      record = data
    } else {
      const { data, error } = await supabase.from('hr_candidates').insert({ ...payload, created_at: new Date().toISOString() }).select('*').maybeSingle()
      if (error) throw error
      record = data
    }

    const pipelineRow = {
      candidate_id: record?.id || candidateId || null,
      stage: payload.pipeline_stage,
      status: status || payload.decision || 'active',
      decision: body?.notes ? String(body.notes).trim() : `Candidate moved to ${payload.pipeline_stage}`,
      owner_id: body?.owner_id || null,
      score: payload.score,
      next_step: body?.next_step || null,
      due_at: body?.due_at || body?.next_action_at || null,
      notes: payload.notes,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    try {
      await supabase.from('hr_recruitment_pipeline').insert(pipelineRow)
    } catch {}

    await logHRActivity({
      action: `hr.recruitment.${action}`,
      entity_type: 'hr_candidate',
      entity_id: record?.id || candidateId || null,
      module: 'hr',
      source: 'Recruitment pipeline endpoint',
      status: 'recorded',
      severity: 'info',
      payload: { action, candidateId, stage, status, decision, body, record, pipelineRow },
      reason: 'Recruitment pipeline mutation persisted to canonical candidate records and pipeline history.',
    })
    revalidatePath('/hr/recruitment')
    revalidatePath('/hr/recruitment/candidates')
    revalidatePath('/hr/recruitment/kanban')
    revalidatePath('/hr')
    revalidatePath('/hr/employees')
    const state = await buildHRDomainLiveState('recruitment')
    return NextResponse.json({
      ok: true,
      endpoint: '/api/hr/recruitment',
      domain: 'recruitment',
      action,
      mutationApplied: true,
      message: 'Recruitment pipeline action applied to the candidate record and pipeline history.',
      record,
      pipelineRow,
      state,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to process Recruitment pipeline action.' }, { status: 500 })
  }
}
