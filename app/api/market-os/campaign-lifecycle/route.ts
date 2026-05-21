import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const TABLES = ['market_os_campaigns','market_os_campaign_tasks','market_os_campaign_budget_entries','market_os_campaign_calendar_items','market_os_campaign_approvals','market_os_campaign_assets','market_os_campaign_risks'] as const
export async function GET() {
  const supabase = await createClient()
  const data: Record<string, any[]> = {}
  for (const table of TABLES) {
    const { data: rows, error } = await supabase.from(table).select('*').order('updated_at', { ascending: false }).limit(1000)
    if (error) return NextResponse.json({ ok:false, live:false, error:error.message, data }, { status:200 })
    data[table] = rows || []
  }
  return NextResponse.json({ ok:true, live:true, data })
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const table = String(body.table || '')
  if (!TABLES.includes(table as any)) return NextResponse.json({ ok:false, error:'Unsupported campaign table' }, { status:400 })
  const supabase = await createClient()
  const row = { ...(body.row || {}), updated_at: new Date().toISOString() }
  const q = row.id ? supabase.from(table).upsert(row).select('*').single() : supabase.from(table).insert(row).select('*').single()
  const { data, error } = await q
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  await supabase.from('market_os_audit_log').insert({ action_key: body.action || 'campaign_lifecycle_upsert', title: row.title || 'Campaign lifecycle update', engine: 'acquisition', payload: body })
  return NextResponse.json({ ok:true, live:true, row:data })
}
