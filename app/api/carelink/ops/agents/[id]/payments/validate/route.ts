import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
function text(v: unknown, f = '') { return v === null || v === undefined || v === '' ? f : String(v).trim() }
function num(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0 }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const caregiverId = Number(params.id)
  const body = await request.json()
  const supabase = await createClient()
  const status = text(body.status, 'validated')
  const row = {
    caregiver_id: caregiverId,
    mission_id: num(body.mission_id) || null,
    period_start: text(body.period_start) || null,
    period_end: text(body.period_end) || null,
    amount: num(body.amount),
    currency: text(body.currency, 'MAD'),
    status,
    validation_type: text(body.validation_type, 'manual'),
    validated_by: text(body.validated_by, 'CareLink Ops Admin'),
    validated_at: status === 'validated' ? new Date().toISOString() : null,
    notes: text(body.notes),
  }
  const { data, error } = await supabase.from('carelink_agent_payment_validations').insert(row).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, validation: data })
}
