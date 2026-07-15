import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function arr(v: unknown) { return Array.isArray(v) ? v.map(String).filter(Boolean) : String(v || '').split(',').map((x) => x.trim()).filter(Boolean) }
function text(v: unknown, f = '') { return v === null || v === undefined || v === '' ? f : String(v).trim() }
function bool(v: unknown, f = false) { return v === undefined || v === null ? f : v === true || v === 'true' || v === 1 || v === '1' }
function num(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : null }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const caregiverId = Number(params.id)
  const body = await request.json()
  const supabase = await createClient()
  const row = {
    caregiver_id: caregiverId,
    preferred_days: arr(body.preferred_days),
    preferred_start_time: text(body.preferred_start_time) || null,
    preferred_end_time: text(body.preferred_end_time) || null,
    max_daily_hours: num(body.max_daily_hours),
    max_weekly_hours: num(body.max_weekly_hours),
    preferred_zones: arr(body.preferred_zones),
    excluded_zones: arr(body.excluded_zones),
    accepts_weekends: bool(body.accepts_weekends),
    accepts_night: bool(body.accepts_night),
    accepts_emergency_replacement: bool(body.accepts_emergency_replacement, true),
    transport_required: bool(body.transport_required),
    roster_notes: text(body.roster_notes),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('carelink_agent_roster_preferences').upsert(row, { onConflict: 'caregiver_id' }).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, roster: data })
}
