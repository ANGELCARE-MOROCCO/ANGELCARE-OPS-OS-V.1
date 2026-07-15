
import AppShell from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'

export default async function ReportsPage() {
  const supabase = await createClient()
  const [missionsRes, contractsRes, incidentsRes, caregiversRes, leadsRes] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false),
    supabase.from('contracts').select('*').eq('is_archived', false),
    supabase.from('incidents').select('*').eq('is_archived', false),
    supabase.from('caregivers').select('*').eq('is_archived', false),
    supabase.from('leads').select('*').eq('is_archived', false),
  ])
  const missions = missionsRes.data || [], contracts = contractsRes.data || [], incidents = incidentsRes.data || [], caregivers = caregiversRes.data || [], leads = leadsRes.data || []
  const completed = missions.filter((m:any)=>String(m.status||'').toLowerCase()==='completed')
  const activeContracts = contracts.filter((c:any)=>String(c.status||'').toLowerCase()==='active')
  const openIncidents = incidents.filter((i:any)=>!['closed','resolved'].includes(String(i.status||'').toLowerCase()))
  const projection = activeContracts.reduce((sum:number,c:any)=>sum + (Number(c.total_sessions||0)-Number(c.sessions_used||0))*250,0)
  return <AppShell title="Executive Reporting & Control" subtitle="Revenue projection, active contracts, missions completed, caregiver productivity, incidents, sales conversion, city performance and renewal risk." breadcrumbs={[{label:'Reports'}]}><section style={gridStyle}><MetricCard label="Revenue projection" value={`${projection.toLocaleString()} MAD`} sub="based on remaining sessions x base rule" icon="💰" accent="#166534"/><MetricCard label="Completed missions" value={completed.length} sub="operational delivery" icon="🏁"/><MetricCard label="Open incidents" value={openIncidents.length} sub="quality control" icon="🚨" accent="#991b1b"/><MetricCard label="Sales conversion pool" value={leads.length} sub="lead base" icon="📈" accent="#7c3aed"/><MetricCard label="Caregiver productivity" value={caregivers.length} sub="active workforce count" icon="👩‍👧" accent="#1d4ed8"/><MetricCard label="Renewal risk" value={contracts.filter((c:any)=>Number(c.total_sessions||0)-Number(c.sessions_used||0)<=2).length} sub="low-session contracts" icon="⚠️" accent="#b45309"/></section><ERPPanel title="Report Library" subtitle="Executive report categories ready for automation and export."><div style={listStyle}>{['Daily revenue projection','Active contracts','Missions completed','Caregiver productivity','Incidents by service','Sales conversion','City performance','Client type performance','Service profitability','Package consumption','Renewal risk','Staff activity'].map(x=><div key={x} style={rowStyle}>{x}</div>)}</div></ERPPanel></AppShell>
}
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14, marginBottom:18 }
const listStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12 }
const rowStyle: React.CSSProperties = { padding:14, borderRadius:16, border:'1px solid #e2e8f0', background:'#fff', color:'#0f172a', fontWeight:900 }
