import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { ActionLink, EmptyState, KpiCard, Panel, ProspectCard, WorkspaceHero, formatCurrency } from '../_components/RevenueOpsPrimitives'

export default async function ProspectsPage({ searchParams }: { searchParams?: Promise<{ segment?: string; stage?: string; city?: string }> }) {
  await requireRole(['ceo','manager','agent'])
  const filters = (await searchParams) || {}
  const supabase = await createClient()
  let q = supabase.from('bd_prospects').select('*').eq('is_archived', false).order('score', { ascending: false }).order('created_at', { ascending: false })
  if (filters.segment && filters.segment !== 'all') q = q.eq('segment', filters.segment)
  if (filters.stage && filters.stage !== 'all') q = q.eq('stage', filters.stage)
  if (filters.city) q = q.ilike('city', `%${filters.city}%`)
  const { data: prospects } = await q
  const ps = prospects || []
  const forecast = ps.reduce((s:number,p:any)=>s+Number(p.estimated_value||0),0)
  return <AppShell title="Prospect Database Pro" subtitle="CRM stratégique B2C/B2B avec segmentation, scoring, propriétaire, prochaine action et pipeline." breadcrumbs={[{label:'Revenue',href:'/revenue-command-center'}, {label:'Prospects'}]} actions={<><PageAction href="/revenue-command-center/cockpit" variant="light">Cockpit</PageAction><PageAction href="/revenue-command-center/prospects/new">Nouveau prospect</PageAction></>}>
    <div style={pageStyle}>
      <WorkspaceHero eyebrow="PROSPECT INTELLIGENCE" title="Corporate Prospect Database" subtitle="Base exploitable pour familles, écoles, crèches, cliniques, entreprises, partenaires prescripteurs et comptes stratégiques." />
      <section style={metricsStyle}><KpiCard label="Prospects" value={ps.length}/><KpiCard label="B2B" value={ps.filter((p:any)=>p.segment==='b2b').length} tone="purple"/><KpiCard label="B2C" value={ps.filter((p:any)=>p.segment==='b2c').length} tone="green"/><KpiCard label="Forecast" value={formatCurrency(forecast)} tone="amber"/></section>
      <form style={filterStyle}><strong>Filtres</strong><select name="segment" defaultValue={filters.segment || 'all'} style={inputStyle}><option value="all">Tous segments</option><option value="b2c">B2C</option><option value="b2b">B2B</option></select><select name="stage" defaultValue={filters.stage || 'all'} style={inputStyle}><option value="all">Tous stages</option><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="closing">Closing</option><option value="lost">Lost</option></select><input name="city" placeholder="Ville..." defaultValue={filters.city || ''} style={inputStyle}/><button style={buttonStyle}>Filtrer</button></form>
      <Panel title="Base prospects" subtitle="Cliquez pour ouvrir le workspace CRM du prospect.">{ps.length ? <div style={cardsStyle}>{ps.map((p:any)=><ProspectCard key={p.id} prospect={p}/>)}</div> : <EmptyState text="Aucun prospect. Créez ou importez une base ciblée."/>}</Panel>
    </div>
  </AppShell>
}
const pageStyle:React.CSSProperties={display:'grid',gap:20}.valueOf(); const metricsStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14}.valueOf(); const filterStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 180px 180px 220px auto',gap:12,alignItems:'center',background:'#fff',border:'1px solid #dbe3ee',borderRadius:24,padding:16}.valueOf(); const inputStyle:React.CSSProperties={padding:'12px 13px',borderRadius:13,border:'1px solid #cbd5e1',background:'#f8fafc',fontWeight:800}.valueOf(); const buttonStyle:React.CSSProperties={border:'none',borderRadius:14,padding:'13px 18px',background:'#0f172a',color:'#fff',fontWeight:950,cursor:'pointer'}.valueOf(); const cardsStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}.valueOf()
