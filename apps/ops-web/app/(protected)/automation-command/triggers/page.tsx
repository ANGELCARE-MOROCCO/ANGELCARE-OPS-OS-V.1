import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAutomationData } from '@/lib/opsos-automation/data'
import { createAutomationTrigger, createAutomationBriefing } from '@/lib/opsos-automation/actions'
import { AutoButton, AutoHero, AutoMetric, AutoPanel, AutoRow, AutoShell, autoGrid } from '@/components/angelcare-enterprise/AutomationUI'

export default async function Page() {
  const data = await getAutomationData()
  return (
    <AppShell title="Automation Triggers" subtitle="Operational trigger registry" breadcrumbs={[{ label: 'Automation', href: '/automation-command' }, { label: 'Triggers' }]} actions={<PageAction href="/automation-command/triggers/new" variant="light">New Trigger</PageAction>}>
      <AutoShell>
        <AutoHero eyebrow="Trigger Registry" title="Automation Triggers" subtitle="Rules that define when operational signals should create briefings, actions or escalations." tone="purple" />
        <AutoPanel title="Trigger List" subtitle="Active and inactive automation triggers." tone="purple">
          {data.triggers.map((t:any) => <AutoRow key={t.id} title={t.title} meta={`${t.module_key} · ${t.trigger_type} · ${t.condition_label}`} status={t.status} href={t.route} tone={t.status === 'active' ? 'green' : 'slate'} />)}
        </AutoPanel>
      </AutoShell>
    </AppShell>
  )
}
