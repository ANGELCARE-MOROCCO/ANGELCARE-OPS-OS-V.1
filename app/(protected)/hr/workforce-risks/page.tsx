import AppShell from '@/app/components/erp/AppShell'
import { HRHero, HRPanel, HRRow } from '../_components/HRMaxUI'

export default function WorkforceRisksPage() {
  return (
    <AppShell title="Workforce Risks" subtitle="Operational workforce risk radar." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Workforce Risks'}]}>
      <HRHero title="Workforce Risks" subtitle="Track workforce instability, attrition pressure and staffing risks." />
      <HRPanel title="Risk radar" subtitle="Current workforce operational risks.">
        {[
          ['High caregiver turnover risk','North region','critical'],
          ['Overloaded roster cluster','Weekend staffing pressure','warning'],
          ['Low onboarding completion','New hires not activated','review'],
          ['Attendance anomaly','Repeated absence patterns','risk'],
        ].map(([t,m,s])=><HRRow key={t} title={t} meta={m} status={s} />)}
      </HRPanel>
    </AppShell>
  )
}
