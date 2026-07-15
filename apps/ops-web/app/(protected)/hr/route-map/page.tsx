import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HR_PHASE6_ALL_ROUTES } from '@/lib/hr-unified/max-phase6-routes'
import { HRHero, HRPanel, HRRow } from '../_components/HRMaxUI'
import { HRPhase6TopNav } from '../_components/HRPhase6Nav'

export default function HRRouteMapPage() {
  return (
    <AppShell
      title="HR Route Map"
      subtitle="Complete HR route inventory for validation and navigation."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Route Map' }]}
      actions={<PageAction href="/hr/navigation" variant="light">Navigation</PageAction>}
    >
      <HRPhase6TopNav />
      <HRHero
        title="HR Route Map"
        subtitle="A strict route inventory used to reduce 404 risk and verify that all HR buttons point to intended workspaces."
      />
      <HRPanel title="Full route list" subtitle={`${HR_PHASE6_ALL_ROUTES.length} HR routes registered in the integration layer.`}>
        {HR_PHASE6_ALL_ROUTES.map((route) => (
          <HRRow
            key={route.href}
            title={route.label}
            meta={`${route.group} • ${route.description} • ${route.href}`}
            status={route.priority}
            href={route.href}
          />
        ))}
      </HRPanel>
    </AppShell>
  )
}
