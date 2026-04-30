import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, Kpi, Panel, RowLink, WorkspaceHero, isOverdue, money } from '../_components/BDV3Primitives'

export default async function StrategyRoomPage() {
  const supabase = await createClient()
  const [{ data: prospects }, { data: tasks }, { data: campaigns }, { data: partnerships }, { data: segments }] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('is_archived', false).limit(100),
    supabase.from('bd_tasks').select('*').limit(100),
    supabase.from('bd_campaigns').select('*').limit(100),
    supabase.from('bd_partnerships').select('*').limit(100),
    supabase.from('bd_market_segments').select('*').limit(100),
  ])
  const p = prospects || []
  const t = tasks || []
  const pipeline = p.reduce((s:number,x:any)=>s+Number(x.estimated_value||0),0)
  const overdue = t.filter((x:any)=>x.status !== 'completed' && isOverdue(x.due_at)).length
  const highPotential = (segments || []).filter((s:any)=>Number(s.potential_score||0)>=75).length
  const recommendations = [
    overdue ? `Close ${overdue} overdue execution tasks before creating new campaigns.` : 'Execution load is under control: push new outreach tasks.',
    p.length < 50 ? 'Prospect database is still too small for domination: schedule database building sprints.' : 'Prospect database has enough base volume: segment and prioritize high-value profiles.',
    highPotential ? `${highPotential} high-potential market segments detected: assign ownership and campaigns.` : 'No high-potential segments yet: complete market mapping first.',
    (partnerships || []).length < 10 ? 'Partnership pipeline must expand: schools, clinics, nurseries, HR departments, family networks.' : 'Partnership base exists: move discussion/negotiation stages to signed agreements.',
  ]
  return <AppShell title="BD Strategy Room" subtitle="Executive planning layer for market mapping, campaigns, partnerships and sales execution." breadcrumbs={[{ label: 'Business Development', href: '/revenue-command-center/business-development' }, { label: 'Strategy Room' }]} actions={<><PageAction href="/revenue-command-center/cockpit">Cockpit</PageAction><PageAction href="/revenue-command-center/tasks/new" variant="light">Create task</PageAction></>}>
    <div style={{ display:'grid', gap:20 }}><WorkspaceHero title="Market Domination Strategy Room" subtitle="Use this room to decide weekly priorities, pressure points and action plan adjustments across B2B and B2C growth." />
    <section style={{ display:'grid', gridTemplateColumns:'repeat(5,minmax(0,1fr))', gap:14 }}><Kpi title="Pipeline" value={money(pipeline)} tone="#16a34a" /><Kpi title="Prospects" value={String(p.length)} /><Kpi title="Campaigns" value={String(campaigns?.length||0)} tone="#f59e0b" /><Kpi title="Partners" value={String(partnerships?.length||0)} tone="#7c3aed" /><Kpi title="Overdue" value={String(overdue)} tone="#dc2626" /></section>
    <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}><Panel title="CEO recommendations" subtitle="Generated from current BD data."><div style={{ display:'grid', gap:12 }}>{recommendations.map((r,i)=><div key={i} style={{ padding:16, borderRadius:18, background:'#f8fafc', border:'1px solid #e2e8f0' }}><Badge tone={i===0&&overdue?'#dc2626':'#2563eb'}>Action {i+1}</Badge><p style={{ marginBottom:0, fontWeight:800 }}>{r}</p></div>)}</div></Panel><Panel title="Strategic workspaces" subtitle="Move from analysis to execution immediately."><div style={{ display:'grid', gap:10 }}>{[['/revenue-command-center/market-mapping','Market Mapping'],['/revenue-command-center/campaigns','Campaigns'],['/revenue-command-center/partnerships','Partnerships'],['/revenue-command-center/prospects','Prospects'],['/revenue-command-center/tasks','Tasks']].map(([href,label])=><RowLink key={href} href={href}><strong>{label}</strong><span>Open workspace and create actions.</span></RowLink>)}</div></Panel></section></div>
  </AppShell>
}
