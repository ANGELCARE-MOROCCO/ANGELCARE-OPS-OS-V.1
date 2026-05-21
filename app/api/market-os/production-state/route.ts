import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const ALLOWED = ['market_os_content_runtime_state','market_os_seo_articles','market_os_seo_keywords','market_os_seo_topic_clusters','market_os_seo_internal_links']
export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table') || 'market_os_content_runtime_state'
  const key = req.nextUrl.searchParams.get('key')
  if (!ALLOWED.includes(table)) return NextResponse.json({ ok:false, error:'Unsupported production state table' }, { status:400 })
  const supabase = await createClient(); let q = supabase.from(table).select('*')
  if (key && table === 'market_os_content_runtime_state') q = q.eq('state_key', key)
  const { data, error } = await q.order('updated_at', { ascending:false }).limit(1000)
  if (error) return NextResponse.json({ ok:false, live:false, error:error.message, data:[] }, { status:200 })
  return NextResponse.json({ ok:true, live:true, data:data||[] })
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({})); const table = body.table || 'market_os_content_runtime_state'
  if (!ALLOWED.includes(table)) return NextResponse.json({ ok:false, error:'Unsupported production state table' }, { status:400 })
  const supabase = await createClient(); const row = { ...(body.row||{}), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from(table).upsert(row, table==='market_os_content_runtime_state'?{ onConflict:'state_key' }:undefined as any).select('*').single()
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  await supabase.from('market_os_audit_log').insert({ action_key: body.action || 'production_state_upsert', title: row.title || row.state_key || 'Market-OS production state updated', engine: 'content', payload: body })
  return NextResponse.json({ ok:true, live:true, row:data })
}
