import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { InsightCard, KpiCard, Panel, WorkspaceHero, formatCurrency } from '../_components/BDWorkspacePrimitives'

export default async function StrategyRoomPage() {
  await requireRole(['ceo','manager'])
  const supabase = await createClient()
  const [{data:prospects},{data:campaigns},{data:appointments}] = await Promise.all([
    supabase.from('bd_prospects').select('*'),
    supabase.from('bd_campaigns').select('*'),
    supabase.from('bd_appointments').select('*'),
  ])
  const ps = prospects || []
  const cs = campaigns || []
  const aps = appointments || []
  const value = ps.reduce((s:number,p:any)=>s+Number(p.estimated_value||0),0)
  const noOwner = ps.filter((p:any)=>!p.owner_user_id).length
  const hot = ps.filter((p:any)=>['hot','qualified','proposal'].includes(p.status)).length
  const activeCampaigns = cs.filter((c:any)=>c.status==='active').length
  return <AppShell title="Revenue Strategy Room" subtitle="CEO planning room for business development, segmentation and market domination." breadcrumbs={[{label:'Revenue',href:'/revenue-command-center'},{label:'Strategy Room'}]} actions={<PageAction href="/revenue-command-center/business-development" variant="light">BD Workspace</PageAction>}><div style={pageStyle}><WorkspaceHero badge="CEO Strategy Room" title="Plan, Execute, Adjust, Dominate" subtitle="Une salle de stratégie pour transformer les données commerciales en plan d'action: segments, villes, campagnes, partenariats, rendez-vous et closing."/><section style={kpiGrid}><KpiCard label="Pipeline potentiel" value={formatCurrency(value)} sub="prospects BD" tone="green"/><KpiCard label="Hot prospects" value={hot} sub="priorité closing" tone="amber"/><KpiCard label="Campagnes actives" value={activeCampaigns} sub="en exécution" tone="blue"/><KpiCard label="Sans owner" value={noOwner} sub="risque discipline" tone="red"/><KpiCard label="Appointments" value={aps.length} sub="agenda commercial" tone="purple"/></section><section style={grid}><Panel title="Weekly Battle Plan" subtitle="Plan d'action manager pour la semaine."><div style={stack}><InsightCard title="1. Database Building" text="Chaque équipe doit enrichir prospects B2B/B2C par ville, segment, source, potentiel et décideur." tone="blue"/><InsightCard title="2. Campaign Execution" text="Lancer campagnes distinctes: B2C familles, B2B institutions, partenariats prescripteurs." tone="green"/><InsightCard title="3. Follow-up Discipline" text="Zéro prospect sans prochaine action. Zéro rendez-vous sans outcome. Zéro campagne sans analyse." tone="amber"/><InsightCard title="4. Closing War Room" text="Chaque prospect hot doit avancer vers proposition, rendez-vous ou contrat dans un cycle court." tone="red"/></div></Panel><Panel title="CEO Alerts" subtitle="Signaux opérationnels à surveiller."><div style={stack}><InsightCard title="Owner Risk" text={`${noOwner} prospects sans propriétaire. À assigner avant toute expansion.`} tone={noOwner?'red':'green'}/><InsightCard title="Campaign Pressure" text={`${activeCampaigns} campagnes actives. Maintenir une cadence hebdomadaire et comparer résultats.`} tone="blue"/><InsightCard title="Pipeline Quality" text={`${hot} prospects hot/qualifiés. Prioriser closing et rendez-vous.`} tone="amber"/></div></Panel></section></div></AppShell>
}
const pageStyle:React.CSSProperties={display:'grid',gap:20}; const kpiGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:14}; const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'1.15fr .85fr',gap:18,alignItems:'start'}; const stack:React.CSSProperties={display:'grid',gap:12}
