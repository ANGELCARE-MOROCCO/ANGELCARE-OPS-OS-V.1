import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { EnterpriseButton, EnterpriseHero, EnterpriseMetric, EnterprisePageShell, EnterprisePanel, EnterpriseRow, enterpriseGrid } from '@/components/angelcare-enterprise/EnterpriseCommandUI'

export default function Page() {
  return (
    <AppShell title="Staff Portal Design System" subtitle="Enterprise UI grammar" breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Design System' }]} actions={<PageAction href="/staff-home" variant="light">Home</PageAction>}>
      <EnterprisePageShell>
        <EnterpriseHero eyebrow="Design Language System" title="AngelCare Enterprise Command UI" subtitle="Reusable premium components for command pages, staff portal, dashboards and enterprise workspaces." tone="blue" />
        <div style={enterpriseGrid}>
          <EnterpriseMetric label="Metric" value="95%" detail="Premium indicator card" tone="blue" />
          <EnterpriseMetric label="Risk" value="3" detail="Operational attention" tone="red" />
          <EnterpriseMetric label="Ready" value="OK" detail="Green signal state" tone="green" />
        </div>
        <div style={{ height: 22 }} />
        <EnterprisePanel title="Component Sample" subtitle="Rows and actions." tone="purple">
          <EnterpriseRow title="Command row" meta="Route, status, context and signal" status="active" tone="purple" />
          <EnterpriseRow title="Risk row" meta="Critical operational item" status="review" tone="red" />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <EnterpriseButton href="/staff-home" tone="blue">Home</EnterpriseButton>
            <EnterpriseButton href="/staff-services" tone="green">Services</EnterpriseButton>
            <EnterpriseButton href="/staff-memos" tone="red">Memos</EnterpriseButton>
          </div>
        </EnterprisePanel>
      </EnterprisePageShell>
    </AppShell>
  )
}
