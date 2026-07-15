import AppShell from '@/app/components/erp/AppShell'
import { HRHero, HRPanel, HRGrid, HRMetric, HRRow } from '../_components/HRMaxUI'

const metrics = [
  { label:'Hiring velocity', value:'18d', detail:'Average time to recruit', tone:'#2563eb' },
  { label:'Attendance stability', value:'94%', detail:'Attendance consistency', tone:'#059669' },
  { label:'Roster pressure', value:'12', detail:'Open scheduling conflicts', tone:'#dc2626' },
  { label:'Compliance readiness', value:'91%', detail:'Verified documents', tone:'#7c3aed' },
]

export default function AnalyticsHubPage() {
  return (
    <AppShell title="HR Analytics Hub" subtitle="Executive analytics and workforce intelligence." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Analytics Hub'}]}>
      <HRHero title="HR Analytics Hub" subtitle="Executive workforce intelligence layer with operational indicators and strategic workforce visibility." />
      <HRGrid min={210}>{metrics.map((m)=><HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{height:22}} />
      <HRPanel title="Strategic insights" subtitle="Operational workforce insights.">
        {[
          ['Recruitment bottleneck','Interview stage causing delays','warning'],
          ['Night shift pressure','Understaffed roster detected','risk'],
          ['Compliance renewal','12 certifications expiring soon','review'],
          ['Onboarding acceleration','Integration time improving','positive'],
        ].map(([t,m,s])=><HRRow key={t} title={t} meta={m} status={s} />)}
      </HRPanel>
    </AppShell>
  )
}
