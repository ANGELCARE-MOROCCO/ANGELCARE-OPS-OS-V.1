import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> | { id: string } }
function uuidLike(value: any) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')) }
function num(value: any) { if (value === undefined || value === null || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null }

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()
  if (!uuidLike(trainerId)) return NextResponse.json({ ok: false, error: 'Valid trainer UUID is required' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const supabase = await createClient()
  const { data: trainer } = await supabase.from('academy_trainers').select('id').eq('id', trainerId).maybeSingle()
  if (!trainer) return NextResponse.json({ ok: false, error: 'Trainer not found' }, { status: 404 })
  const payload = {
    trainer_id: trainerId,
    cohort_id: num(body.cohort_id),
    category: body.category || 'admin',
    note: body.note || body.body || '',
    priority: body.priority || 'normal',
    status: body.status || 'open',
    created_by: body.created_by || 'Academy OS',
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('academy_trainer_operational_notes').insert(payload).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data, note: data }, { headers: { 'Cache-Control': 'no-store' } })
}
