import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAcademyData, nameOf } from '../_data'
import { PageHeader, Card, DataTable, Kpi, LinkButton, Badge, page, grid3 } from '../_components/AcademyUI'

export default async function AcademyJobPlacementPage() {
  const data = await getAcademyData()
  return <AppShell title="Academy Job Placement" subtitle="Graduate insertion and partner matching pipeline." breadcrumbs={[{label:'Academy',href:'/academy'},{label:'Job Placement'}]} actions={<PageAction href="/academy/partners">Partners</PageAction>}>
    <div style={page}><PageHeader title="Graduate placement command" subtitle="Match certified trainees with kindergartens, preschools, events, home nanny missions and partner opportunities."/>
    <div style={grid3}><Kpi label="Graduation follow-ups" value={data.graduation_followups.length}/><Kpi label="Partners" value={data.partners.length} tone="#7c3aed"/><Kpi label="Certificates" value={data.certificates.length} tone="#0891b2"/></div>
    <Card><h2>Placement pipeline</h2><DataTable headers={['Graduate','Partner','Status','Next Action','Due']} rows={data.graduation_followups.map((g:any)=>[nameOf(data.trainees,g.trainee_id),nameOf(data.partners,g.partner_id),<Badge>{g.status}</Badge>,g.next_action||g.note||'Match with partner',g.due_at?new Date(g.due_at).toLocaleDateString():'—'])}/></Card></div>
  </AppShell>
}
