import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

const TABLE = 'capital_board_reports'
const INSERTABLE = [
  'reference_code',
  'title',
  'report_type',
  'template_id',
  'report_date',
  'reporting_period',
  'author_name',
  'audience',
  'status',
  'summary',
  'highlights',
  'risks',
  'next_steps',
  'decisions_required',
  'sections',
  'metrics',
  'preview_variant',
  'approval_notes',
  'approved_at',
  'approved_by',
] as const

function clean(body: AnyRecord) {
  const payload: AnyRecord = {}
  for (const key of INSERTABLE) {
    if (!(key in body)) continue
    const value = body[key]
    if (key === 'sections') payload[key] = Array.isArray(value) ? value : []
    else if (key === 'metrics') payload[key] = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    else if (key === 'report_date') payload[key] = value ? String(value) : new Date().toISOString().slice(0, 10)
    else if (key === 'approved_at') payload[key] = value || null
    else payload[key] = value === '' ? null : value
  }
  if (!payload.reference_code) payload.reference_code = `CCR-RPT-${new Date().getFullYear()}-${Date.now()}`
  if (!payload.title) payload.title = 'Untitled board report'
  if (!payload.report_type) payload.report_type = 'daily_work_report'
  if (!payload.template_id) payload.template_id = 'daily-work'
  if (!payload.status) payload.status = 'draft'
  payload.updated_at = new Date().toISOString()
  return payload
}

function json(data: AnyRecord, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(250)

    if (error) {
      return json({ ok: false, error: error.message, data: { reports: [] } })
    }

    return json({ ok: true, data: { reports: Array.isArray(data) ? data : [] } })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Unable to load board reports', data: { reports: [] } })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const payload = clean(body && typeof body === 'object' ? body : {})

    if (body?.id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq('id', body.id)
        .select('*')
        .single()

      if (error) return json({ ok: false, error: error.message, data: { report: null } }, 400)
      return json({ ok: true, data: { report: data } })
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select('*')
      .single()

    if (error) return json({ ok: false, error: error.message, data: { report: null } }, 400)
    return json({ ok: true, data: { report: data } })
  } catch (error: any) {
    return json({ ok: false, error: error?.message || 'Unable to save board report', data: { report: null } }, 500)
  }
}
