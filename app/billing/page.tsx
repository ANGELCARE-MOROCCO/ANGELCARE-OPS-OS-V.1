
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: contracts } = await supabase.from('contracts').select('*').eq('is_archived', false)
  const rows = contracts || []
  const remaining = rows.reduce((s:number,c:any)=>s+Math.max(0,Number(c.total_sessions||0)-Number(c.sessions_used||0)),0)
  return <AppShell title="Contracts & Billing Center" subtitle="Invoice-ready summaries, contract consumption and billing preparation." breadcrumbs={[{label:'Contracts & Billing'}]} actions={<><PageAction href="/contracts/new">+ Contract</PageAction><PageAction href="/print" variant="light">Print invoice-ready summary</PageAction></>}><section style={gridStyle}><MetricCard label="Contracts" value={rows.length} sub="portfolio" icon="📦"/><MetricCard label="Remaining sessions" value={remaining} sub="billable capacity" icon="🎯"/><MetricCard label="Invoice-ready" value="Ready" sub="template available" icon="🧾"/></section><ERPPanel title="Billing preparation"><div style={{display:'grid',gap:10}}>{rows.slice(0,10).map((c:any)=><div key={c.id} style={rowStyle}><strong>{c.contract_reference || `Contract #${c.id}`}</strong><span>{c.service_type || 'Service'} • {Number(c.sessions_used||0)} / {Number(c.total_sessions||0)} sessions</span></div>)}</div></ERPPanel></AppShell>
}
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14, marginBottom:18 }
const rowStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:12, padding:14, borderRadius:16, border:'1px solid #e2e8f0', background:'#fff', color:'#0f172a' }
