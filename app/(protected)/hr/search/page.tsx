import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function HRSearchPage() {
  const data = await getHRPhase5()
  const rows = [
    ...data.staff.map((x:any)=>({...x, type:'Staff', title:x.full_name || x.name, href:`/hr/staff/${x.id}`})),
    ...data.candidates.map((x:any)=>({...x, type:'Candidate', title:x.full_name, href:`/hr/recruitment/candidates/${x.id}`})),
    ...data.openings.map((x:any)=>({...x, type:'Opening', title:x.title, href:`/hr/openings/${x.id}`})),
  ]
  return <AppShell title="HR Global Search" subtitle="Unified people and opening search." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Search'}]} actions={<PageAction href="/hr/control-room" variant="light">Control Room</PageAction>}>
    <HRHero title="HR Global Search" subtitle="A searchable command index for staff, candidates and openings. Browser search works immediately; later phases can add server filters." />
    <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>
    <div style={{height:22}} />
    <HRPanel title="Search index" subtitle="Staff, candidates and openings.">
      {rows.slice(0,120).map((x:any)=><HRRow key={`${x.type}-${x.id}`} title={x.title || 'Record'} meta={`${x.type} • ${x.department || x.source || x.position || x.city || 'HR'}`} status={x.status || x.stage || x.type} href={x.href}/>)}
    </HRPanel>
  </AppShell>
}
