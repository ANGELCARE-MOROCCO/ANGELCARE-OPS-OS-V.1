import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { OPSOS_GLOBAL_ROUTES, OPSOS_MODULES } from '@/lib/opsos-global/mega-pack-v1'
import { GlobalHero, GlobalMetric, GlobalPanel, GlobalRow, GlobalShell, globalGrid } from '@/components/angelcare-enterprise/GlobalEnterpriseUI'

export default function Page() {
  return (
    <AppShell title="OPS OS Final QA" subtitle="Global enterprise mega pack QA" breadcrumbs={[{ label: 'OPS OS', href: '/enterprise-command' }, { label: 'Final QA' }]} actions={<PageAction href="/enterprise-command" variant="light">Command</PageAction>}>
      <GlobalShell>
        <GlobalHero eyebrow="Global Mega Pack QA" title="Enterprise Operating System QA" subtitle="Smoke-test and route validation for the global enterprise specialization layer." tone="green" stats={[{ label: 'Routes', value: OPSOS_GLOBAL_ROUTES.length }, { label: 'Modules', value: OPSOS_MODULES.length }, { label: 'SQL', value: 0 }]} />
        <div style={globalGrid}>
          <GlobalMetric label="Global Routes" value={OPSOS_GLOBAL_ROUTES.length} detail="New command routes" tone="blue" />
          <GlobalMetric label="Modules" value={OPSOS_MODULES.length} detail="Specialized domains" tone="purple" />
          <GlobalMetric label="Backend Risk" value="LOW" detail="No SQL changes" tone="green" />
        </div>
        <div style={{ height: 22 }} />
        <GlobalPanel title="Smoke-test routes" subtitle="Open each route after deployment." tone="green">
          {OPSOS_GLOBAL_ROUTES.map((route) => <GlobalRow key={route} title={route} meta="OPS OS global route" status="open" href={route} tone="green" />)}
        </GlobalPanel>
      </GlobalShell>
    </AppShell>
  )
}
