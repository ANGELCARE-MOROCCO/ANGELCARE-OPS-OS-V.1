import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase8Data } from '@/lib/hr-unified/max-phase8-data'
import { HRHero, HRGrid, HRMetric, HRPanel, HRRow, HRButton } from '../_components/HRMaxUI'

export default async function ExecutiveAutomationPage() {
  const data = await getHRPhase8Data()

  const automations = [
    ['Daily recruitment escalation scan','Auto-detect blocked candidates older than SLA'],
    ['Roster conflict escalation','Push uncovered shifts to HR ops'],
    ['Compliance expiry watch','Detect expiring staff documents'],
    ['Approval bottleneck monitor','Identify approvals stuck > 48h'],
    ['Attendance anomaly scan','Flag missing attendance patterns'],
    ['Onboarding readiness monitor','Detect incomplete onboarding'],
  ]

  return (
    <AppShell
      title="HR Executive Automation"
      subtitle="Executive automation and command intelligence."
      breadcrumbs={[{label:'HR',href:'/hr'},{label:'Executive Automation'}]}
      actions={<PageAction href="/hr/operations-console" variant="light">Operations Console</PageAction>}
    >
      <HRHero
        title="HR Executive Automation"
        subtitle="Automation-oriented executive layer for escalation monitoring, SLA pressure detection, compliance tracking and HR operational intelligence."
        actions={<><HRButton href="/hr/sla-center" variant="blue">SLA Center</HRButton><HRButton href="/hr/compliance-watch" variant="light">Compliance Watch</HRButton></>}
      />

      <HRGrid min={210}>
        {data.metrics.map((m:any)=><HRMetric key={m.label} {...m} />)}
      </HRGrid>

      <div style={{height:22}} />

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
        <HRPanel title="Automation intelligence" subtitle="Recommended automation engines.">
          {automations.map(([title,desc])=>(
            <HRRow key={title} title={title} meta={desc} status="active" />
          ))}
        </HRPanel>

        <HRPanel title="Executive links" subtitle="Open strategic HR command workspaces.">
          <div style={{display:'grid',gap:10}}>
            {[
              ['/hr/control-room','Control Room'],
              ['/hr/command-queue','Command Queue'],
              ['/hr/risk-center','Risk Center'],
              ['/hr/system-health','System Health'],
              ['/hr/escalations','Escalations'],
              ['/hr/quality','Quality'],
            ].map(([href,label])=>(
              <a key={href} href={href} style={{display:'block',padding:14,border:'1px solid #e2e8f0',borderRadius:16,textDecoration:'none',color:'#0f172a',background:'#f8fafc',fontWeight:900}}>
                {label}
              </a>
            ))}
          </div>
        </HRPanel>
      </div>
    </AppShell>
  )
}
