import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAutomationData } from '@/lib/opsos-automation/data'
import { createAutomationTrigger, createAutomationBriefing } from '@/lib/opsos-automation/actions'
import { AutoButton, AutoHero, AutoMetric, AutoPanel, AutoRow, AutoShell, autoGrid } from '@/components/angelcare-enterprise/AutomationUI'

export default async function Page() {
  const data = await getAutomationData()
  return (
    <AppShell title="Automation Rules" subtitle="Condition/action map" breadcrumbs={[{ label: 'Automation', href: '/automation-command' }, { label: 'Rules' }]}>
      <AutoShell>
        <AutoHero eyebrow="Rules Map" title="Automation Rules" subtitle="Rules define the intended logic between signals, actions, briefings and escalations." tone="amber" />
        <AutoPanel title="Rules" subtitle="Current rules and future orchestration logic." tone="amber">
          {data.rules.map((r:any) => <AutoRow key={r.id} title={r.title} meta={`${r.module_key} · ${r.condition_label} → ${r.action_label}`} status={r.status} tone="amber" />)}
        </AutoPanel>
      </AutoShell>
    </AppShell>
  )
}
