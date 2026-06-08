import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>
type RouteContext = { params: Promise<{ id: string; paymentId: string }> | { id: string; paymentId: string } }
function uuidLike(value: any) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')) }
function money(value: any) { const n = Number(value); return Number.isFinite(n) ? n : 0 }
function num(value: any) { if (value === undefined || value === null || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null }

function patch(body: AnyRecord) {
  const out: AnyRecord = { updated_at: new Date().toISOString() }
  ;['program_title','cohort_reference','cohort_title','payment_reference','reference_number','label','compensation_model_key','compensation_model_label','status','payment_method','payment_details','rejected_reason','finance_note','audit_code'].forEach((key) => {
    if (body[key] !== undefined) out[key] = body[key] || null
  })
  ;['cohort_id','program_id','participant_tier'].forEach((key) => { if (body[key] !== undefined) out[key] = num(body[key]) })
  if (body.amount_dhs !== undefined) out.amount_dhs = money(body.amount_dhs)
  if (body.due_date !== undefined) out.due_date = body.due_date || null
  if (body.paid_date !== undefined) out.paid_date = body.paid_date || null
  if (body.manual_override !== undefined) out.manual_override = Boolean(body.manual_override)
  if (body.status === 'paid') out.paid_at = body.paid_at || new Date().toISOString()
  return out
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()
  const paymentId = String(params.paymentId || '').trim()
  if (!uuidLike(trainerId) || !uuidLike(paymentId)) return NextResponse.json({ ok: false, error: 'Valid trainer/payment UUID is required' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const supabase = await createClient()
  const { data, error } = await supabase.from('academy_trainer_payments').update(patch(body)).eq('id', paymentId).eq('trainer_id', trainerId).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 })
  return NextResponse.json({ ok: true, data, payment: data }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()
  const paymentId = String(params.paymentId || '').trim()
  if (!uuidLike(trainerId) || !uuidLike(paymentId)) return NextResponse.json({ ok: false, error: 'Valid trainer/payment UUID is required' }, { status: 400 })
  const supabase = await createClient()
  const { error } = await supabase.from('academy_trainer_payments').delete().eq('id', paymentId).eq('trainer_id', trainerId)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
