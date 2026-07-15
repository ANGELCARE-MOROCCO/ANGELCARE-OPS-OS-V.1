import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRMaxPhase1Snapshot } from '@/lib/hr-unified/max-phase1-data'
import { HRHero, HRMetric, HRGrid, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function ExecutiveHRCockpitPage() {
  const snap = await getHRMaxPhase1Snapshot()
  return (
    <AppShell title="Executive HR Cockpit" subtitle="Board-level HR command and risk visibility." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Executive'}]} actions={<PageAction href="/hr">HR Dashboard</PageAction>}>
      <HRHero title="Executive HR Cockpit" subtitle="A command view for HR risk, recruitment throughput, task backlog, approvals and workforce control." actions={<><HRButton href="/hr/recruitment/kanban" variant="light">Recruitment Kanban</HRButton><HRButton href="/hr/approvals" variant="blue">Approvals</HRButton><HRButton href="/hr/tasks" variant="light">Tasks</HRButton></>} />
      <HRGrid min={210}>{snap.metrics.map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>
      <div style={{height:22}} />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:20}}>
        <HRPanel title="Recruitment pressure" subtitle="Candidate and opening signals.">
          {snap.candidates.slice(0,10).map((c:any)=><HRRow key={c.id} title={c.full_name} meta={`${c.stage || 'new'} • ${c.source || 'manual'} • ${c.city || ''}`} status={c.status} href={`/hr/recruitment/candidates/${c.id}`}/>)}
        </HRPanel>
        <HRPanel title="Execution backlog" subtitle="Open HR tasks.">
          {snap.tasks.slice(0,10).map((t:any)=><HRRow key={t.id} title={t.title} meta={`${t.task_type || 'general'} • ${t.priority || 'medium'}`} status={t.status}/>)}
        </HRPanel>
        <HRPanel title="Approval risk" subtitle="Pending decisions.">
          {snap.approvals.slice(0,10).map((a:any)=><HRRow key={a.id} title={a.title} meta={`${a.approval_type || 'general'} • ${a.priority || 'medium'}`} status={a.status}/>)}
        </HRPanel>
      </div>
    </AppShell>
  )
}
