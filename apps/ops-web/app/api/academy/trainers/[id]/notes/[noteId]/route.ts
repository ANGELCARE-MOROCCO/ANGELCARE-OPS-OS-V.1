import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string; noteId: string }> | { id: string; noteId: string } }
function uuidLike(value: any) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')) }
function num(value: any) { if (value === undefined || value === null || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const trainerId = String(params.id || '').trim()
  const noteId = String(params.noteId || '').trim()
  if (!uuidLike(trainerId) || !uuidLike(noteId)) return NextResponse.json({ ok: false, error: 'Valid trainer/note UUID is required' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.cohort_id !== undefined) patch.cohort_id = num(body.cohort_id)
  ;['category','note','priority','status','created_by'].forEach((key) => { if (body[key] !== undefined) patch[key] = body[key] || null })
  const supabase = await createClient()
  const { data, error } = await supabase.from('academy_trainer_operational_notes').update(patch).eq('id', noteId).eq('trainer_id', trainerId).select('*').maybeSingle()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ ok: false, error: 'Note not found' }, { status: 404 })
  return NextResponse.json({ ok: true, data, note: data }, { headers: { 'Cache-Control': 'no-store' } })
}
