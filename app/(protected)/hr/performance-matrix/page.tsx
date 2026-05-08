import AppShell from '@/app/components/erp/AppShell'
import { HRHero, HRPanel, HRRow } from '../_components/HRMaxUI'

export default function PerformanceMatrixPage() {
  const rows = [
    ['Recruitment team','92% target achievement','excellent'],
    ['HR Operations','87% SLA compliance','good'],
    ['Onboarding office','74% completion speed','review'],
    ['Compliance office','95% verification rate','excellent'],
  ]

  return (
    <AppShell title="Performance Matrix" subtitle="HR operational performance matrix." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Performance Matrix'}]}>
      <HRHero title="Performance Matrix" subtitle="Department-level HR performance and execution monitoring." />
      <HRPanel title="Performance overview" subtitle="Operational department indicators.">
        {rows.map(([t,m,s])=><HRRow key={t} title={t} meta={m} status={s} />)}
      </HRPanel>
    </AppShell>
  )
}
