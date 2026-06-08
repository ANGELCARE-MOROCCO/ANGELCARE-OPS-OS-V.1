import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>
type RouteContext = { params: Promise<{ id: string }> | { id: string } }

function uuidLike(value: any) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')) }
function money(value: any) { const n = Number(value); return Number.isFinite(n) ? n : 0 }
function num(value: any) { if (value === undefined || value === null || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null }
function ref(seed?: any) { return `TRP-${new Date().getFullYear()}-${String(seed || Date.now()).replace(/\D/g, '').slice(-6).padStart(6, '0')}` }
function audit(trainerId: string, cohortId?: any) { return `TRPAY-${String(trainerId).replace(/[^a-z0-9]/gi, '').slice(0,8).toUpperCase()}-${String(cohortId || 'NOCOHORT').replace(/[^a-z0-9]/gi, '').slice(0,8).toUpperCase()}-${Date.now()}` }

function normalize(body: AnyRecord, trainerId: string) {
  const reference = body.reference_number || body.payment_reference || ref()
  return {
    trainer_id: trainerId,
    cohort_id: num(body.cohort_id),
    program_id: num(body.program_id),
    program_title: body.program_title || null,
    cohort_reference: body.cohort_reference || null,
    cohort_title: body.cohort_title || null,
    payment_reference: reference,
    reference_number: reference,
    label: body.label || body.compensation_model_label || 'Trainer payment',
    compensation_model_key: body.compensation_model_key || null,
    compensation_model_label: body.compensation_model_label || null,
    participant_tier: num(body.participant_tier),
    amount_dhs: money(body.amount_dhs),
    status: body.status || 'pending',
    payment_method: body.payment_method || null,
    payment_details: body.payment_details || null,
    due_date: body.due_date || null,
    paid_at: body.status === 'paid' ? (body.paid_at || new Date().toISOString()) : null,
    paid_date: body.paid_date || null,
    rejected_reason: body.status === 'rejected' ? (body.rejected_reason || null) : null,
    finance_note: body.finance_note || null,
    manual_override: Boolean(body.manual_override),
    audit_code: body.audit_code || audit(trainerId, body.cohort_id),
    updated_at: new Date().toISOString(),
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()
  if (!uuidLike(trainerId)) return NextResponse.json({ ok: false, error: 'Valid trainer UUID is required' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const supabase = await createClient()
  const { data: trainer } = await supabase.from('academy_trainers').select('id').eq('id', trainerId).maybeSingle()
  if (!trainer) return NextResponse.json({ ok: false, error: 'Trainer not found' }, { status: 404 })
  const { data, error } = await supabase.from('academy_trainer_payments').insert(normalize(body, trainerId)).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data, payment: data }, { headers: { 'Cache-Control': 'no-store' } })
}
