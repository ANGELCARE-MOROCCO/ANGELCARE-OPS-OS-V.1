import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getAutomationData } from '@/lib/opsos-automation/data'
import { createAutomationTrigger, createAutomationBriefing } from '@/lib/opsos-automation/actions'
import { AutoButton, AutoHero, AutoMetric, AutoPanel, AutoRow, AutoShell, autoGrid } from '@/components/angelcare-enterprise/AutomationUI'

const routes = ['/automation-command','/automation-command/triggers','/automation-command/triggers/new','/automation-command/briefings','/automation-command/rules','/automation-command/final-qa']

export default async function Page() {
  const data = await getAutomationData()
  return (
    <AppShell title="Automation Final QA" subtitle="Smoke-test automation layer" breadcrumbs={[{ label: 'Automation', href: '/automation-command' }, { label: 'Final QA' }]}>
      <AutoShell>
        <AutoHero eyebrow="Final QA" title="Automation Intelligence QA" subtitle="Validate automation, triggers, briefings and routes before deployment." tone="slate" stats={[{ label: 'Routes', value: routes.length }, { label: 'Triggers', value: data.triggers.length }, { label: 'Briefings', value: data.briefings.length }]} />
        <AutoPanel title="Smoke-test routes" subtitle="Open after build and deployment." tone="slate">
          {routes.map((route) => <AutoRow key={route} title={route} meta="Automation route" status="open" href={route} tone="slate" />)}
        </AutoPanel>
      </AutoShell>
    </AppShell>
  )
}
