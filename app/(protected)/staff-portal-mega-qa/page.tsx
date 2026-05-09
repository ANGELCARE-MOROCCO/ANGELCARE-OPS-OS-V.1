import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { EnterpriseHero, EnterpriseMetric, EnterprisePageShell, EnterprisePanel, EnterpriseRow, enterpriseGrid } from '@/components/angelcare-enterprise/EnterpriseCommandUI'

const routes = ['/staff-home','/staff-portal-command','/staff-portal-executive','/staff-portal-workbench','/staff-services','/staff-services/admin','/staff-memos','/staff-memos/new','/staff-portal-navigation','/staff-portal-route-audit','/staff-portal-final-qa','/staff-portal-access-check','/staff-portal-design-system']

export default function Page() {
  return (
    <AppShell title="Staff Portal Mega QA" subtitle="Mega phase validation" breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Mega QA' }]} actions={<PageAction href="/staff-home" variant="light">Home</PageAction>}>
      <EnterprisePageShell>
        <EnterpriseHero eyebrow="Mega Phase 7 QA" title="Staff Portal Mega Consolidation QA" subtitle="Route list and smoke-test surface for the consolidated premium staff portal package." tone="green" stats={[{ label: 'Routes', value: routes.length }, { label: 'Package', value: 'Mega Phase 7' }, { label: 'Backend risk', value: 'None' }]} />
        <div style={enterpriseGrid}>
          <EnterpriseMetric label="Routes" value={routes.length} detail="Smoke-test route count" tone="blue" />
          <EnterpriseMetric label="SQL" value="0" detail="No database changes" tone="green" />
          <EnterpriseMetric label="UI System" value="1" detail="Enterprise component library" tone="purple" />
        </div>
        <div style={{ height: 22 }} />
        <EnterprisePanel title="Smoke-test routes" subtitle="Open after build/deployment." tone="green">
          {routes.map((route) => <EnterpriseRow key={route} title={route} meta="Staff Portal OS route" status="open" href={route} tone="green" />)}
        </EnterprisePanel>
      </EnterprisePageShell>
    </AppShell>
  )
}
