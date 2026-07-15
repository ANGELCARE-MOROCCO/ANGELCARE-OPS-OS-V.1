import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

type RouteContext = { params: Promise<{ id: string }> | { id: string } }

function cleanArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? value : []
}

async function safeQuery<T = any>(builder: PromiseLike<{ data: T[] | null; error: any }>) {
  try {
    const { data, error } = await builder
    if (error) return []
    return cleanArray<T>(data)
  } catch {
    return []
  }
}

async function safeSingle<T = any>(builder: PromiseLike<{ data: T | null; error: any }>) {
  try {
    const { data, error } = await builder
    if (error) return null
    return data
  } catch {
    return null
  }
}

function uuidLike(value: any) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function numberOrNull(value: any) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toMoney(value: any) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function safeDate(value: any) {
  return value ? String(value).slice(0, 10) : null
}

function nowStamp() {
  return new Date().toISOString()
}

function generatePaymentReference(seed?: any) {
  const year = new Date().getFullYear()
  const suffix = String(seed || Date.now()).replace(/\D/g, '').slice(-6).padStart(6, '0')
  return `TRP-${year}-${suffix}`
}

function generateAuditCode(trainerId: string, cohortId?: any) {
  const trainer = String(trainerId || 'TR').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
  const cohort = String(cohortId || 'NOCOHORT').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
  return `TRPAY-${trainer}-${cohort}-${Date.now()}`
}

function liveStatus(cohort: AnyRecord) {
  const now = new Date()
  const start = cohort.start_date ? new Date(`${String(cohort.start_date).slice(0, 10)}T00:00:00`) : null
  const end = cohort.end_date ? new Date(`${String(cohort.end_date).slice(0, 10)}T23:59:59`) : null
  if (start && end && start <= now && end >= now) return 'ongoing'
  if (end && end < now) return 'finished'
  return 'upcoming'
}

function modelKey(value: string, index: number) {
  return String(value || `model-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `model-${index + 1}`
}

function extractTier(label: any, appliesTo: any) {
  const text = `${label || ''} ${appliesTo || ''}`.toLowerCase()
  const match = text.match(/(?:^|\D)(20|30|50)(?:\D|$)/)
  return match ? Number(match[1]) : null
}

function extractCompensationModels(program: AnyRecord, priceRows: AnyRecord[]) {
  const models: AnyRecord[] = []
  const baseAmount = toMoney(program?.base_price_dhs || program?.base_price || program?.price || program?.amount)

  if (baseAmount > 0) {
    models.push({
      key: 'base-price',
      label: 'Base program compensation',
      source: 'academy_programs.base_price_dhs',
      participant_tier: null,
      amount_dhs: baseAmount,
      applies_to: 'Base program rate',
      billing_type: 'base',
    })
  }

  priceRows.forEach((row, index) => {
    const amount = toMoney(row.amount_dhs || row.amount || row.price)
    if (!amount && !row.label) return
    models.push({
      key: modelKey(row.label || row.billing_type || row.applies_to, index),
      label: row.label || `Program pricing row ${index + 1}`,
      source: 'academy_program_pricing_rows',
      participant_tier: extractTier(row.label, row.applies_to),
      amount_dhs: amount,
      applies_to: row.applies_to || 'All participants',
      billing_type: row.billing_type || 'program',
      raw: row,
    })
  })

  const jsonSources = [program?.parameters, program?.outcomes, program?.compensation_models, program?.pricing, program?.tiers]
  jsonSources.forEach((source, sourceIndex) => {
    const list = Array.isArray(source)
      ? source
      : Array.isArray(source?.compensation_models)
        ? source.compensation_models
        : Array.isArray(source?.pricing_rows)
          ? source.pricing_rows
          : Array.isArray(source?.tiers)
            ? source.tiers
            : []

    list.forEach((row: AnyRecord, index: number) => {
      const amount = toMoney(row.amount_dhs || row.amount || row.price || row.value)
      if (!amount && !row.label && !row.title) return
      models.push({
        key: modelKey(row.key || row.label || row.title || `json-${sourceIndex}-${index}`, index),
        label: row.label || row.title || `Configured compensation ${index + 1}`,
        source: 'program_json',
        participant_tier: Number(row.participant_tier || row.tier || row.participants) || extractTier(row.label, row.applies_to),
        amount_dhs: amount,
        applies_to: row.applies_to || row.description || 'Configured in program details',
        billing_type: row.billing_type || row.type || 'program_json',
        raw: row,
      })
    })
  })

  return models
}

function normalizePaymentRow(row: AnyRecord, trainerId: string) {
  const reference = row.reference_number || row.payment_reference || generatePaymentReference(row.id)
  const audit = row.audit_code || generateAuditCode(trainerId, row.cohort_id)
  return {
    id: row.id || undefined,
    trainer_id: trainerId,
    cohort_id: numberOrNull(row.cohort_id),
    program_id: numberOrNull(row.program_id),
    program_title: row.program_title || null,
    cohort_reference: row.cohort_reference || null,
    cohort_title: row.cohort_title || null,
    payment_reference: reference,
    reference_number: reference,
    label: row.label || row.compensation_model_label || 'Trainer payment',
    compensation_model_key: row.compensation_model_key || null,
    compensation_model_label: row.compensation_model_label || null,
    participant_tier: numberOrNull(row.participant_tier),
    amount_dhs: toMoney(row.amount_dhs),
    status: row.status || 'pending',
    payment_method: row.payment_method || null,
    payment_details: row.payment_details || null,
    due_date: safeDate(row.due_date),
    paid_at: row.paid_at || (row.status === 'paid' ? nowStamp() : null),
    paid_date: safeDate(row.paid_date || row.paid_at),
    rejected_reason: row.status === 'rejected' ? (row.rejected_reason || null) : null,
    finance_note: row.finance_note || null,
    manual_override: Boolean(row.manual_override),
    audit_code: audit,
    updated_at: nowStamp(),
  }
}

function normalizeNoteRow(row: AnyRecord, trainerId: string) {
  return {
    id: row.id || undefined,
    trainer_id: trainerId,
    cohort_id: numberOrNull(row.cohort_id),
    category: row.category || 'admin',
    note: row.note || row.body || '',
    priority: row.priority || 'normal',
    status: row.status || 'open',
    created_by: row.created_by || 'Academy OS',
    updated_at: nowStamp(),
  }
}

async function buildManagementPayload(supabase: any, trainerId: string) {
  const trainer = await safeSingle<AnyRecord>(
    supabase.from('academy_trainers').select('*').eq('id', trainerId).maybeSingle(),
  )

  if (!trainer) return null

  const cohorts = await safeQuery<AnyRecord>(
    supabase.from('academy_cohorts').select('*').eq('trainer_id', trainerId).order('start_date', { ascending: false }),
  )

  const programIds = Array.from(new Set(cohorts.map((cohort) => cohort.program_id).filter(Boolean).map(String)))

  const [programRows, pricingRows, payments, notes, assignments] = await Promise.all([
    programIds.length
      ? safeQuery<AnyRecord>(supabase.from('academy_programs').select('*').in('id', programIds))
      : Promise.resolve([]),
    programIds.length
      ? safeQuery<AnyRecord>(supabase.from('academy_program_pricing_rows').select('*').in('program_id', programIds).order('sort_order', { ascending: true }))
      : Promise.resolve([]),
    uuidLike(trainerId)
      ? safeQuery<AnyRecord>(supabase.from('academy_trainer_payments').select('*').eq('trainer_id', trainerId).order('created_at', { ascending: false }))
      : Promise.resolve([]),
    uuidLike(trainerId)
      ? safeQuery<AnyRecord>(supabase.from('academy_trainer_operational_notes').select('*').eq('trainer_id', trainerId).order('created_at', { ascending: false }))
      : Promise.resolve([]),
    safeQuery<AnyRecord>(supabase.from('academy_trainer_assignments').select('*').eq('trainer_id', trainerId).order('start_time', { ascending: false })),
  ])

  const programById = new Map(programRows.map((program) => [String(program.id), program]))
  const priceRowsByProgram = new Map<string, AnyRecord[]>()
  pricingRows.forEach((row) => {
    const key = String(row.program_id)
    priceRowsByProgram.set(key, [...(priceRowsByProgram.get(key) || []), row])
  })

  const normalizedCohorts: AnyRecord[] = cohorts.map((cohort) => {
    const program = programById.get(String(cohort.program_id)) || {}
    const prices = priceRowsByProgram.get(String(cohort.program_id)) || []
    const participants = Number(cohort.participants_count || cohort.enrollment_count || cohort.approved_enrollments_count || 0)
    const capacity = Number(cohort.capacity || 0)
    return {
      ...cohort,
      program_title: cohort.program_title || program.title || program.program_name || null,
      training_start_time: cohort.training_start_time || cohort.start_time || '09:00',
      training_end_time: cohort.training_end_time || cohort.end_time || '17:00',
      live_status: liveStatus(cohort),
      participants_count: participants,
      capacity,
      compensation_models: extractCompensationModels(program, prices),
    }
  })

  const availableProgramCompensationModels = normalizedCohorts.map((cohort: AnyRecord) => ({
    cohort_id: cohort.id,
    cohort_reference: cohort.reference_number,
    cohort_title: cohort.title,
    program_id: cohort.program_id,
    program_title: cohort.program_title,
    models: cohort.compensation_models || [],
  }))

  const paidTotal = payments.filter((row) => row.status === 'paid').reduce((sum, row) => sum + toMoney(row.amount_dhs), 0)
  const pendingTotal = payments.filter((row) => row.status === 'pending').reduce((sum, row) => sum + toMoney(row.amount_dhs), 0)
  const rejectedTotal = payments.filter((row) => row.status === 'rejected').reduce((sum, row) => sum + toMoney(row.amount_dhs), 0)

  const pendingWithDates = payments
    .filter((row) => row.status === 'pending' && row.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))

  const totals = {
    cohorts: normalizedCohorts.length,
    live_cohorts: normalizedCohorts.length,
    ongoing: normalizedCohorts.filter((row) => row.live_status === 'ongoing').length,
    upcoming: normalizedCohorts.filter((row) => row.live_status === 'upcoming').length,
    finished: normalizedCohorts.filter((row) => row.live_status === 'finished').length,
    payments_total: payments.reduce((sum, row) => sum + toMoney(row.amount_dhs), 0),
    paid_total: paidTotal,
    pending_total: pendingTotal,
    rejected_total: rejectedTotal,
    pending_count: payments.filter((row) => row.status === 'pending').length,
    paid_count: payments.filter((row) => row.status === 'paid').length,
    rejected_count: payments.filter((row) => row.status === 'rejected').length,
    next_payment_due: pendingWithDates[0]?.due_date || null,
    notes: notes.length,
    assignments: assignments.length,
  }

  return {
    trainer,
    cohorts: normalizedCohorts,
    payments,
    notes,
    assignments,
    availableProgramCompensationModels,
    stats: totals,
    totals,
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()

  if (!trainerId) return NextResponse.json({ ok: false, error: 'Missing trainer id' }, { status: 400 })

  const supabase = await createClient()
  const payload = await buildManagementPayload(supabase, trainerId)

  if (!payload) return NextResponse.json({ ok: false, error: 'Trainer not found' }, { status: 404 })

  return NextResponse.json({ ok: true, ...payload, data: payload }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()

  if (!trainerId || !uuidLike(trainerId)) {
    return NextResponse.json({ ok: false, error: 'Valid trainer UUID is required for management saves' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const payments = Array.isArray(body.payments) ? body.payments : []
  const notes = Array.isArray(body.notes) ? body.notes : []
  const supabase = await createClient()

  const trainer = await safeSingle<AnyRecord>(supabase.from('academy_trainers').select('id').eq('id', trainerId).maybeSingle())
  if (!trainer) return NextResponse.json({ ok: false, error: 'Trainer not found' }, { status: 404 })

  const paymentRows = payments.map((row: AnyRecord) => normalizePaymentRow(row, trainerId))
  const noteRows = notes.map((row: AnyRecord) => normalizeNoteRow(row, trainerId))

  if (paymentRows.length) {
    const { error } = await supabase.from('academy_trainer_payments').upsert(paymentRows, { onConflict: 'id' })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (noteRows.length) {
    const { error } = await supabase.from('academy_trainer_operational_notes').upsert(noteRows, { onConflict: 'id' })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const payload = await buildManagementPayload(supabase, trainerId)
  return NextResponse.json({ ok: true, ...payload, data: payload }, { headers: { 'Cache-Control': 'no-store' } })
}
