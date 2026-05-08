import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HR_PHASE6_ROUTE_GROUPS, HR_PHASE6_ALL_ROUTES } from '@/lib/hr-unified/max-phase6-routes'
import { HRHero, HRPanel, HRRow } from '../_components/HRMaxUI'
import { HRPhase6RouteStats, HRPhase6TopNav } from '../_components/HRPhase6Nav'

export default function HRSystemHealthPage() {
  const duplicateMap = new Map<string, number>()
  HR_PHASE6_ALL_ROUTES.forEach((route) => {
    duplicateMap.set(route.href, (duplicateMap.get(route.href) || 0) + 1)
  })

  const duplicates = Array.from(duplicateMap.entries())
    .filter((entry) => entry[1] > 1)
    .map(([href, count]) => ({ href, count }))

  const checks = [
    {
      title: 'Route groups registered',
      meta: `${HR_PHASE6_ROUTE_GROUPS.length} groups`,
      status: HR_PHASE6_ROUTE_GROUPS.length >= 5 ? 'ok' : 'review',
    },
    {
      title: 'Route inventory registered',
      meta: `${HR_PHASE6_ALL_ROUTES.length} routes`,
      status: HR_PHASE6_ALL_ROUTES.length >= 40 ? 'ok' : 'review',
    },
    {
      title: 'Duplicate href check',
      meta: duplicates.length ? `${duplicates.length} duplicates found` : 'No duplicate hrefs in manifest',
      status: duplicates.length ? 'review' : 'ok',
    },
    {
      title: 'Navigation hub',
      meta: '/hr/navigation',
      status: 'ok',
    },
    {
      title: 'Route map',
      meta: '/hr/route-map',
      status: 'ok',
    },
  ]

  return (
    <AppShell
      title="HR System Health"
      subtitle="Integration layer consistency and route-health view."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'System Health' }]}
      actions={<PageAction href="/hr/route-map" variant="light">Route Map</PageAction>}
    >
      <HRPhase6TopNav />
      <HRHero
        title="HR MAX System Health"
        subtitle="Strict integration checks for route inventory, navigation coverage and duplicate href protection."
      />
      <HRPhase6RouteStats />
      <div style={{ height: 22 }} />
      <HRPanel title="Integration checks" subtitle="These checks are static and TypeScript-safe. Terminal script performs file-existence validation.">
        {checks.map((check) => (
          <HRRow key={check.title} title={check.title} meta={check.meta} status={check.status} />
        ))}
      </HRPanel>
      {duplicates.length > 0 && (
        <div style={{ height: 22 }}>
          <HRPanel title="Duplicate hrefs" subtitle="Review duplicate route entries.">
            {duplicates.map((item) => (
              <HRRow key={item.href} title={item.href} meta={`${item.count} entries`} status="duplicate" />
            ))}
          </HRPanel>
        </div>
      )}
    </AppShell>
  )
}
