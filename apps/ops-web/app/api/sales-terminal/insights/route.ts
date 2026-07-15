import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const todayIso = () => new Date().toISOString().slice(0, 10)

export async function GET() {
  const supabase = await createClient()
  const { data: orders, error } = await supabase.from('sales_orders').select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 })
  const safe = orders || []
  const active = safe.filter((o:any) => !['cancelled','archived'].includes(String(o.status || '')))
  const confirmed = safe.filter((o:any) => ['confirmed','paid','assigned','delivered'].includes(String(o.status || '')))
  const today = todayIso()
  const todayRevenue = safe.filter((o:any) => String(o.created_at || '').slice(0,10) === today && ['confirmed','paid','assigned','delivered'].includes(String(o.status || ''))).reduce((s:number,o:any)=>s+Number(o.total_amount||0),0)
  const pipeline = active.reduce((s:number,o:any)=>s+Number(o.total_amount||0),0)
  const avg = safe.length ? pipeline / safe.length : 0
  const risk = safe.filter((o:any) => (String(o.status)==='confirmed' && String(o.payment_status)!=='paid') || String(o.fulfillment_status)==='blocked' || Number(o.total_amount || 0) > 5000).length
  const { count: actionCount } = await supabase.from('sales_action_queue').select('*', { count:'exact', head:true }).eq('status','open')
  const { count: docCount } = await supabase.from('sales_documents').select('*', { count:'exact', head:true })
  const { count: auditCount } = await supabase.from('sales_audit_logs').select('*', { count:'exact', head:true })
  return NextResponse.json({ ok:true, data:{ revenue_today: todayRevenue, pipeline_value: pipeline, conversion_rate: safe.length ? (confirmed.length / safe.length) * 100 : 0, avg_deal_size: avg, risk_orders: risk, action_queue: actionCount || 0, document_count: docCount || 0, agent_actions: auditCount || 0 } })
}
