import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, KpiCard, Panel, TableShell, WorkspaceHero, safeDate } from '../_components/BDWorkspacePrimitives'

export default async function AppointmentsWorkspace() {
  await requireRole(['ceo','manager'])
  const supabase = await createClient()
  const { data } = await supabase.from('bd_appointments').select('*').order('scheduled_at', { ascending: true })
  const appointments = data || []
  const scheduled = appointments.filter((a:any)=>a.status==='scheduled').length
  const done = appointments.filter((a:any)=>a.status==='done').length
  const missed = appointments.filter((a:any)=>a.status==='missed').length
  return <AppShell title="Appointments Handling" subtitle="Agenda business development, rendez-vous institutionnels, meetings partenaires et suivi commercial." breadcrumbs={[{label:'Revenue',href:'/revenue-command-center'},{label:'Appointments'}]} actions={<PageAction href="/revenue-command-center/business-development" variant="light">BD Workspace</PageAction>}><div style={pageStyle}><WorkspaceHero badge="Meeting Discipline" title="Appointments & Follow-up Control" subtitle="Pilotez les rendez-vous B2C/B2B, préparez les meetings, enregistrez les résultats et transformez chaque échange en prochaine action."/><section style={kpiGrid}><KpiCard label="Rendez-vous" value={appointments.length} sub="total"/><KpiCard label="Planifiés" value={scheduled} sub="à préparer" tone="blue"/><KpiCard label="Réalisés" value={done} sub="exécutés" tone="green"/><KpiCard label="Manqués" value={missed} sub="à récupérer" tone="red"/></section><Panel title="Agenda commercial" subtitle="Tous les rendez-vous BD et partenariats.">{appointments.length?<TableShell><table style={table}><thead><tr><th style={th}>Titre</th><th style={th}>Date</th><th style={th}>Type</th><th style={th}>Statut</th><th style={th}>Lieu</th><th style={th}>Résultat</th></tr></thead><tbody>{appointments.map((a:any)=><tr key={a.id}><td style={td}><strong>{a.title}</strong></td><td style={td}>{safeDate(a.scheduled_at)}</td><td style={td}>{a.meeting_type||'meeting'}</td><td style={td}><Badge tone={a.status==='done'?'green':a.status==='missed'?'red':'blue'}>{a.status||'scheduled'}</Badge></td><td style={td}>{a.location||'—'}</td><td style={td}>{a.outcome||'—'}</td></tr>)}</tbody></table></TableShell>:<EmptyState text="Aucun rendez-vous enregistré."/>}</Panel></div></AppShell>
}
const pageStyle:React.CSSProperties={display:'grid',gap:20}; const kpiGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14}; const table:React.CSSProperties={width:'100%',borderCollapse:'collapse'}; const th:React.CSSProperties={textAlign:'left',padding:14,background:'#0f172a',color:'#fff'}; const td:React.CSSProperties={padding:14,borderBottom:'1px solid #e2e8f0',color:'#334155'}
