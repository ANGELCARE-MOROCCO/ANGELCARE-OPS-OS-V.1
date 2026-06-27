import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function num(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function nullableNumber(value: unknown) {
  const n = num(value)
  return n || null
}

function rowFromBody(caregiverId: number, body: Record<string, any>) {
  const status = text(body.status, 'draft')
  return {
    caregiver_id: caregiverId,
    label: text(body.label || body.title || 'Payment record'),
    mission_id: nullableNumber(body.mission_id || body.missionId),
    amount: num(body.amount),
    currency: text(body.currency, 'MAD'),
    status,
    validation_type: text(body.validation_type || body.validationType, 'manual'),
    period_start: body.period_start || body.periodStart || null,
    period_end: body.period_end || body.periodEnd || null,
    notes: text(body.notes || body.description || ''),
    validated_at: status === 'validated' ? new Date().toISOString() : null,
    validated_by: status === 'validated' ? text(body.validated_by || body.validatedBy, 'CareLink Ops Admin') : null,
    updated_at: new Date().toISOString(),
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const caregiverId = Number(params.id)
  const supabase = await createClient()
  if (!Number.isFinite(caregiverId)) return NextResponse.json({ ok: false, error: 'Invalid caregiver id', records: [] }, { status: 400 })

  const { data, error } = await supabase
    .from('carelink_agent_payment_validations')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ ok: false, error: error.message, records: [] }, { status: 500 })
  return NextResponse.json({ ok: true, records: data || [] })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const caregiverId = Number(params.id)
  const body = await request.json()
  const supabase = await createClient()
  if (!Number.isFinite(caregiverId)) return NextResponse.json({ ok: false, error: 'Invalid caregiver id' }, { status: 400 })

  const row = rowFromBody(caregiverId, body)
  if (!row.amount || row.amount <= 0) return NextResponse.json({ ok: false, error: 'Amount must be greater than zero' }, { status: 400 })

  const { data, error } = await supabase.from('carelink_agent_payment_validations').insert(row).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, record: data })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const caregiverId = Number(params.id)
  const body = await request.json()
  const id = Number(body.id)
  const supabase = await createClient()
  if (!Number.isFinite(caregiverId) || !Number.isFinite(id)) return NextResponse.json({ ok: false, error: 'Valid caregiver id and payment id are required' }, { status: 400 })

  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  if ('label' in body || 'title' in body) patch.label = text(body.label || body.title)
  if ('mission_id' in body || 'missionId' in body) patch.mission_id = nullableNumber(body.mission_id || body.missionId)
  if ('amount' in body) patch.amount = num(body.amount)
  if ('currency' in body) patch.currency = text(body.currency, 'MAD')
  if ('status' in body) patch.status = text(body.status, 'draft')
  if ('period_start' in body || 'periodStart' in body) patch.period_start = body.period_start || body.periodStart || null
  if ('period_end' in body || 'periodEnd' in body) patch.period_end = body.period_end || body.periodEnd || null
  if ('notes' in body || 'description' in body) patch.notes = text(body.notes || body.description)
  if ('validation_type' in body || 'validationType' in body) patch.validation_type = text(body.validation_type || body.validationType, 'manual')
  if (patch.status === 'validated') {
    patch.validated_at = new Date().toISOString()
    patch.validated_by = text(body.validated_by || body.validatedBy, 'CareLink Ops Admin')
  }

  const { data, error } = await supabase
    .from('carelink_agent_payment_validations')
    .update(patch)
    .eq('id', id)
    .eq('caregiver_id', caregiverId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, record: data })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const caregiverId = Number(params.id)
  const body = await request.json()
  const id = Number(body.id)
  const supabase = await createClient()
  if (!Number.isFinite(caregiverId) || !Number.isFinite(id)) return NextResponse.json({ ok: false, error: 'Valid caregiver id and payment id are required' }, { status: 400 })

  const { error } = await supabase
    .from('carelink_agent_payment_validations')
    .delete()
    .eq('id', id)
    .eq('caregiver_id', caregiverId)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, deleted: id })
}
