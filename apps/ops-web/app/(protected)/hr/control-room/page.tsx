import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton } from '../_components/HRMaxUI'

export default async function HRControlRoomPage() {
  const data = await getHRPhase5()
  const links = [
    ['/hr/search','Global HR Search','Search staff, candidates and openings.'],
    ['/hr/playbooks','Playbooks','Operating procedures and workflows.'],
    ['/hr/templates','Templates','Reusable HR messages and forms.'],
    ['/hr/bulk-actions','Bulk Actions','Batch execution queue.'],
    ['/hr/quality','Quality Reviews','QA and data quality control.'],
    ['/hr/calendar','Calendar','HR events and planning.'],
    ['/hr/escalations','Escalations','Critical HR issue control.'],
    ['/hr/analytics','Analytics','Management intelligence.'],
  ]
  return <AppShell title="HR Control Room" subtitle="Phase 5 command expansion." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Control Room'}]} actions={<PageAction href="/hr" variant="light">HR Dashboard</PageAction>}>
    <HRHero title="HR Control Room — Command Expansion" subtitle="A central operating room for search, playbooks, templates, bulk actions, QA, calendar planning and escalations." />
    <HRGrid min={210}>{data.metrics.map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>
    <div style={{height:22}} />
    <HRPanel title="Command modules" subtitle="Open each Phase 5 command workspace.">
      <HRGrid min={260}>{links.map(([href,title,desc])=><a key={href} href={href} style={{display:'block',padding:18,border:'1px solid #e2e8f0',borderRadius:22,background:'#f8fafc',textDecoration:'none',color:'#0f172a'}}>
        <h3 style={{margin:'0 0 6px',fontSize:19}}>{title}</h3>
        <p style={{margin:0,color:'#64748b',fontWeight:700,lineHeight:1.5}}>{desc}</p>
      </a>)}</HRGrid>
    </HRPanel>
    <div style={{height:22}} />
    <HRPanel title="Live command queue" subtitle="Tasks, approvals and escalations.">
      {[...data.tasks.slice(0,8), ...data.approvals.slice(0,8), ...data.escalations.slice(0,8)].map((x:any)=><HRRow key={x.id} title={x.title || x.escalation_type || 'Command item'} meta={`${x.task_type || x.approval_type || x.severity || 'HR'} • ${x.priority || x.status || 'normal'}`} status={x.status}/>)}
    </HRPanel>
  </AppShell>
}
