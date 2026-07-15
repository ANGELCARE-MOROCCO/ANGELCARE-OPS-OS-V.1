import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAutomationData } from '@/lib/opsos-automation/data'
import { createAutomationTrigger, createAutomationBriefing } from '@/lib/opsos-automation/actions'
import { AutoButton, AutoHero, AutoMetric, AutoPanel, AutoRow, AutoShell, autoGrid } from '@/components/angelcare-enterprise/AutomationUI'

export default async function Page() {
  const data = await getAutomationData()
  return (
    <AppShell title="Automation Command" subtitle="Triggers, briefings and operational intelligence" breadcrumbs={[{ label: 'OPS OS', href: '/enterprise-command' }, { label: 'Automation Command' }]} actions={<PageAction href="/automation-command/triggers/new" variant="light">New Trigger</PageAction>}>
      <AutoShell>
        <AutoHero eyebrow="Automation Intelligence Layer" title="OPSOS Automation Command" subtitle="Rules, triggers, briefings and operational intelligence that push the app beyond passive dashboards." tone="blue" stats={[{ label: 'Triggers', value: data.triggers.length }, { label: 'Rules', value: data.rules.length }, { label: 'Briefings', value: data.briefings.length }]} actions={<><AutoButton href="/automation-command/triggers" tone="blue">Triggers</AutoButton><AutoButton href="/automation-command/briefings" tone="green">Briefings</AutoButton><AutoButton href="/automation-command/final-qa" tone="slate">Final QA</AutoButton></>} />
        <div style={autoGrid}>{data.metrics.map((m) => <AutoMetric key={m.label} {...m} />)}</div>
        <div style={{ height: 22 }} />
        <AutoPanel title="Active Automation Triggers" subtitle="Operational listeners and action definitions." tone="blue">
          {data.activeTriggers.map((t:any) => <AutoRow key={t.id} title={t.title} meta={`${t.module_key} · ${t.condition_label} → ${t.action_label}`} status={t.status} href={t.route} tone="blue" />)}
        </AutoPanel>
      </AutoShell>
    </AppShell>
  )
}
