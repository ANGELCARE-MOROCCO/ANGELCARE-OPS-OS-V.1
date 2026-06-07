import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

function cleanArray(value: any) {
  return Array.isArray(value) ? value : []
}

async function safeQuery<T = any>(builder: PromiseLike<{ data: T[] | null; error: any }>) {
  try {
    const { data, error } = await builder
    if (error) return []
    return cleanArray(data)
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

function uuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()

  if (!trainerId) {
    return NextResponse.json({ ok: false, error: 'Missing trainer id' }, { status: 400 })
  }

  const supabase = await createClient()

  const trainer = await safeSingle<AnyRecord>(
    supabase
      .from('academy_trainers')
      .select('*')
      .eq('id', trainerId)
      .maybeSingle(),
  )

  const cohorts = await safeQuery<AnyRecord>(
    supabase
      .from('academy_cohorts')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('start_date', { ascending: false }),
  )

  const payments = uuidLike(trainerId)
    ? await safeQuery<AnyRecord>(
        supabase
          .from('academy_trainer_payments')
          .select('*')
          .eq('trainer_id', trainerId)
          .order('created_at', { ascending: false }),
      )
    : []

  const notes = uuidLike(trainerId)
    ? await safeQuery<AnyRecord>(
        supabase
          .from('academy_trainer_operational_notes')
          .select('*')
          .eq('trainer_id', trainerId)
          .order('created_at', { ascending: false }),
      )
    : []

  const assignments = await safeQuery<AnyRecord>(
    supabase
      .from('academy_trainer_assignments')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('start_time', { ascending: false }),
  )

  const now = new Date()

  const normalizedCohorts = cohorts.map((cohort) => {
    const start = cohort.start_date ? new Date(cohort.start_date) : null
    const end = cohort.end_date ? new Date(cohort.end_date) : null
    let live_status = 'upcoming'

    if (start && end && start <= now && end >= now) live_status = 'ongoing'
    if (end && end < now) live_status = 'finished'

    return {
      ...cohort,
      live_status,
    }
  })

  const totals = {
    cohorts: normalizedCohorts.length,
    ongoing: normalizedCohorts.filter((row) => row.live_status === 'ongoing').length,
    upcoming: normalizedCohorts.filter((row) => row.live_status === 'upcoming').length,
    finished: normalizedCohorts.filter((row) => row.live_status === 'finished').length,
    payments_total: payments.reduce((sum, row) => sum + Number(row.amount_dhs || 0), 0),
    paid_total: payments.filter((row) => row.status === 'paid').reduce((sum, row) => sum + Number(row.amount_dhs || 0), 0),
    pending_total: payments.filter((row) => row.status === 'pending').reduce((sum, row) => sum + Number(row.amount_dhs || 0), 0),
    rejected_total: payments.filter((row) => row.status === 'rejected').reduce((sum, row) => sum + Number(row.amount_dhs || 0), 0),
    notes: notes.length,
    assignments: assignments.length,
  }

  return NextResponse.json({
    ok: true,
    trainer,
    cohorts: normalizedCohorts,
    payments,
    notes,
    assignments,
    totals,
  })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()

  if (!trainerId || !uuidLike(trainerId)) {
    return NextResponse.json({ ok: false, error: 'Valid trainer UUID is required for management saves' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const payments = Array.isArray(body.payments) ? body.payments : []
  const notes = Array.isArray(body.notes) ? body.notes : []

  const supabase = await createClient()

  const paymentRows = payments.map((row: AnyRecord) => ({
    id: row.id && uuidLike(String(row.id)) ? row.id : undefined,
    trainer_id: trainerId,
    cohort_id: row.cohort_id ? Number(row.cohort_id) : null,
    program_id: row.program_id ? Number(row.program_id) : null,
    payment_reference: row.payment_reference || null,
    label: row.label || 'Trainer payment',
    amount_dhs: Number(row.amount_dhs || 0),
    status: row.status || 'pending',
    payment_method: row.payment_method || null,
    payment_details: row.payment_details || null,
    due_date: row.due_date || null,
    paid_at: row.status === 'paid' ? (row.paid_at || new Date().toISOString()) : null,
    rejected_reason: row.status === 'rejected' ? (row.rejected_reason || null) : null,
    updated_at: new Date().toISOString(),
  }))

  const noteRows = notes.map((row: AnyRecord) => ({
    id: row.id && uuidLike(String(row.id)) ? row.id : undefined,
    trainer_id: trainerId,
    cohort_id: row.cohort_id ? Number(row.cohort_id) : null,
    category: row.category || 'admin',
    note: row.note || '',
    status: row.status || 'open',
    created_by: row.created_by || 'Academy OS',
    updated_at: new Date().toISOString(),
  }))

  if (paymentRows.length) {
    const { error } = await supabase
      .from('academy_trainer_payments')
      .upsert(paymentRows, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
  }

  if (noteRows.length) {
    const { error } = await supabase
      .from('academy_trainer_operational_notes')
      .upsert(noteRows, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
