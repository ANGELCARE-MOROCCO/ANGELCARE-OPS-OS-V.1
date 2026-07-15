import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { GlobalButton, GlobalHero, GlobalMetric, GlobalPanel, GlobalRow, GlobalShell, globalGrid } from '@/components/angelcare-enterprise/GlobalEnterpriseUI'

export default function Page() {
  return (
    <AppShell title="OPS OS Design System" subtitle="Global enterprise UI system" breadcrumbs={[{ label: 'OPS OS', href: '/enterprise-command' }, { label: 'Design System' }]} actions={<PageAction href="/enterprise-command" variant="light">Command</PageAction>}>
      <GlobalShell>
        <GlobalHero eyebrow="Design Language" title="AngelCare Global Enterprise UI" subtitle="Shared premium UI grammar for command centers, module specialization, dashboards, rows, panels, routes and executive views." tone="blue" />
        <div style={globalGrid}>
          <GlobalMetric label="Blue" value="95%" detail="Command metric" tone="blue" />
          <GlobalMetric label="Risk" value="3" detail="Critical attention" tone="red" />
          <GlobalMetric label="Ready" value="OK" detail="Stable state" tone="green" />
        </div>
        <div style={{ height: 22 }} />
        <GlobalPanel title="Rows and buttons" subtitle="Reusable enterprise elements." tone="purple">
          <GlobalRow title="Command row" meta="Context, route, signal and status" status="active" tone="purple" />
          <GlobalRow title="Risk row" meta="Operational item needing attention" status="review" tone="red" />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <GlobalButton href="/enterprise-command" tone="blue">Command</GlobalButton>
            <GlobalButton href="/opsos-final-qa" tone="green">Final QA</GlobalButton>
          </div>
        </GlobalPanel>
      </GlobalShell>
    </AppShell>
  )
}
