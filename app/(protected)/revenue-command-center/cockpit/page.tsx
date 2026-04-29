import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { ActionLink, EmptyState, KpiCard, Panel, TaskCard, WorkspaceHero, formatCurrency } from '../_components/RevenueOpsPrimitives'

export default async function RevenueCockpitPage() {
  await requireRole(['ceo','manager','agent'])
  const supabase = await createClient()
  const [{ data: prospects }, { data: campaigns }, { data: tasks }, { data: appointments }, { data: partnerships }, { data: users }] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('bd_campaigns').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('bd_tasks').select('*').eq('is_archived', false).order('end_at', { ascending: true, nullsFirst: false }),
    supabase.from('bd_appointments').select('*').eq('is_archived', false).order('scheduled_at', { ascending: true, nullsFirst: false }),
    supabase.from('bd_partnerships').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('app_users').select('id, full_name, username')
  ])
  const ps = prospects || [], cs = campaigns || [], ts = tasks || [], ap = appointments || [], pts = partnerships || []
  const usersMap = new Map((users || []).map((u:any)=>[u.id,u.full_name || u.username]))
  const overdue = ts.filter((t:any)=>t.end_at && new Date(t.end_at).getTime() < Date.now() && t.status !== 'completed')
  const dueSoon = ts.filter((t:any)=>t.end_at && new Date(t.end_at).getTime() >= Date.now() && new Date(t.end_at).getTime() < Date.now()+48*3600*1000 && t.status !== 'completed')
  const forecast = ps.reduce((sum:number,p:any)=>sum+Number(p.estimated_value||0),0) + pts.reduce((sum:number,p:any)=>sum+Number(p.estimated_value||0),0)
  const hot = ps.filter((p:any)=>['hot','qualified','proposal','closing'].includes(p.stage)).length

  return <AppShell title="Revenue Execution Cockpit" subtitle="Poste de pilotage centralisé BD/Sales : prospects, tâches, campagnes, rendez-vous, partenariats et actions prioritaires." breadcrumbs={[{label:'Revenue', href:'/revenue-command-center'}, {label:'Cockpit'}]} actions={<><PageAction href="/revenue-command-center/tasks/new">Créer tâche</PageAction><PageAction href="/revenue-command-center/prospects/new" variant="light">Nouveau prospect</PageAction></>}>
    <div style={pageStyle}>
      <WorkspaceHero eyebrow="ANGELCARE REVENUE BACKOFFICE" title="Sales & Business Development Operating System" subtitle="Un cockpit unique pour orienter les commerciaux, suivre les prospects, piloter les campagnes, sécuriser les rendez-vous et transformer les opportunités en contrats." right={<div style={rightHeroStyle}><strong>{formatCurrency(forecast)}</strong><span>Forecast pipeline</span></div>} />
      <section style={navGridStyle}>
        <ActionLink href="/revenue-command-center/prospects">🎯 Prospect Database</ActionLink>
        <ActionLink href="/revenue-command-center/tasks">✅ Task Command</ActionLink>
        <ActionLink href="/revenue-command-center/campaigns">📣 Campaigns</ActionLink>
        <ActionLink href="/revenue-command-center/appointments">📅 Appointments</ActionLink>
        <ActionLink href="/revenue-command-center/partnerships">🤝 Partnerships</ActionLink>
        <ActionLink href="/revenue-command-center/market-mapping">🗺 Market Mapping</ActionLink>
      </section>
      <section style={metricGridStyle}>
        <KpiCard label="Prospects actifs" value={ps.length} sub="base exploitable" />
        <KpiCard label="Hot / Qualified" value={hot} sub="priorité closing" tone="amber" />
        <KpiCard label="Tâches ouvertes" value={ts.filter((t:any)=>t.status!=='completed').length} sub="backoffice actions" tone="purple" />
        <KpiCard label="Overdue" value={overdue.length} sub="danger suivi" tone="red" />
        <KpiCard label="Rendez-vous" value={ap.length} sub="pipeline agenda" tone="green" />
        <KpiCard label="Partenariats" value={pts.length} sub="B2B engine" tone="slate" />
      </section>
      <section style={gridStyle}>
        <Panel title="Cockpit Actions Today" subtitle="Priorités exécutives à traiter maintenant.">
          {overdue.length ? overdue.slice(0,8).map((t:any)=><TaskCard key={t.id} task={t} assigneeName={usersMap.get(t.assigned_to)} />) : dueSoon.length ? dueSoon.slice(0,8).map((t:any)=><TaskCard key={t.id} task={t} assigneeName={usersMap.get(t.assigned_to)} />) : <EmptyState text="Aucune tâche critique. Créez des actions pour structurer le travail des agents." />}
        </Panel>
        <Panel title="Revenue Brain" subtitle="Lecture automatique du système.">
          <div style={brainStyle}><strong>{overdue.length ? '🔴 Exécution en retard' : hot ? '🟠 Closing à pousser' : '🟢 Système stable'}</strong><p>{overdue.length ? `${overdue.length} tâche(s) en retard doivent être rattrapées avant de créer plus de volume.` : hot ? `${hot} prospect(s) chauds doivent recevoir appels, rendez-vous ou proposition.` : 'Le cockpit attend plus de données prospects, campagnes et tâches.'}</p></div>
          <div style={miniGridStyle}><ActionLink href="/revenue-command-center/tasks/new" tone="green">+ Tâche</ActionLink><ActionLink href="/revenue-command-center/prospects/new" tone="light">+ Prospect</ActionLink></div>
        </Panel>
      </section>
    </div>
  </AppShell>
}
const pageStyle:React.CSSProperties={display:'grid',gap:20}.valueOf()
const rightHeroStyle:React.CSSProperties={display:'grid',gap:4,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.16)',borderRadius:24,padding:18,minWidth:230}.valueOf()
const navGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(6,minmax(0,1fr))',gap:12}.valueOf()
const metricGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(6,minmax(0,1fr))',gap:14}.valueOf()
const gridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1.25fr .75fr',gap:18,alignItems:'start'}.valueOf()
const brainStyle:React.CSSProperties={padding:18,borderRadius:20,background:'linear-gradient(135deg,#0f172a,#1e3a8a)',color:'#fff',lineHeight:1.6}.valueOf()
const miniGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}.valueOf()
