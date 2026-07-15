import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ entity: string; id: string }> | { entity: string; id: string } }
type AnyRecord = Record<string, any>

const TABLES: Record<string, string> = {
  investors: 'capital_investors',
  opportunities: 'capital_opportunities',
  commitments: 'capital_commitments',
  payments: 'capital_payments',
  diligence: 'capital_diligence_tasks',
  documents: 'capital_documents',
  notes: 'capital_notes',
  trainings: 'capital_training_pages',
}

function safeData(body: AnyRecord) {
  const current = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {}
  const extras: AnyRecord = {}
  for (const [key, value] of Object.entries(body)) {
    if (key.startsWith('data_')) extras[key.replace(/^data_/, '')] = value
  }
  return { ...current, ...extras }
}

function money(value: any) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function clean(body: AnyRecord) {
  const patch: AnyRecord = { updated_at: new Date().toISOString() }
  for (const [key, value] of Object.entries(body)) {
    if (['id', 'reference_number', 'created_at', 'updated_at', 'outstanding_amount'].includes(key) || key.startsWith('data_')) continue
    if (key.endsWith('_amount') || ['amount', 'valuation', 'target_amount', 'received_amount', 'committed_amount', 'ticket_size_min', 'ticket_size_max'].includes(key)) patch[key] = money(value)
    else if (key.endsWith('_id')) patch[key] = value ? Number(value) : null
    else patch[key] = value === '' ? null : value
  }
  if (body.data !== undefined || Object.keys(safeData(body)).length > 0) {
    patch.data = safeData(body)
  }
  return patch
}

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const { entity, id } = await context.params
    const table = TABLES[entity]
    const recordId = Number(id)
    if (!table || !Number.isFinite(recordId)) return NextResponse.json({ ok: false, error: 'Invalid update target' }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).update(clean(body)).eq('id', recordId).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to update record' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  try {
    const { entity, id } = await context.params
    const table = TABLES[entity]
    const recordId = Number(id)
    if (!table || !Number.isFinite(recordId)) return NextResponse.json({ ok: false, error: 'Invalid delete target' }, { status: 400 })
    const supabase = await createClient()
    const { error } = await supabase.from(table).update({ archived: true, updated_at: new Date().toISOString() }).eq('id', recordId)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to archive record' }, { status: 500 })
  }
}
