import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
function text(v: unknown, f = '') { return v === null || v === undefined || v === '' ? f : String(v).trim() }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const caregiverId = Number(params.id)
  const body = await request.json()
  const supabase = await createClient()
  const row = {
    caregiver_id: caregiverId,
    training_path: text(body.training_path),
    onboarding_status: text(body.onboarding_status, 'pending'),
    hygiene_status: text(body.hygiene_status, 'pending'),
    reporting_status: text(body.reporting_status, 'pending'),
    emergency_status: text(body.emergency_status, 'pending'),
    special_needs_status: text(body.special_needs_status, 'not_required'),
    certification_status: text(body.certification_status, 'pending'),
    next_training_date: text(body.next_training_date) || null,
    trainer_name: text(body.trainer_name),
    learning_notes: text(body.learning_notes),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('carelink_agent_training_plans').upsert(row, { onConflict: 'caregiver_id' }).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, training: data })
}
