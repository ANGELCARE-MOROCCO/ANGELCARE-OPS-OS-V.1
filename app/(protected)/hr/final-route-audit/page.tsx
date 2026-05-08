import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HR_FINAL_ROUTES } from '@/lib/hr-unified/max-phase12-final-routes'
import { HRHero, HRPanel, HRRow } from '../_components/HRMaxUI'

export default function HRFinalRouteAuditPage() {
  return (
    <AppShell title="HR Final Route Audit" subtitle="Full final route manifest." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Final Route Audit' }]} actions={<PageAction href="/hr/final-qa" variant="light">Final QA</PageAction>}>
      <HRHero title="Final Route Audit" subtitle="Use this page as the final clickable route map before deployment." />
      <HRPanel title="Final HR route manifest" subtitle={`${HR_FINAL_ROUTES.length} routes registered.`}>
        {HR_FINAL_ROUTES.map((route) => (
          <HRRow key={route.href} title={route.label} meta={`${route.area} • ${route.href}`} status={route.criticality} href={route.href} />
        ))}
      </HRPanel>
    </AppShell>
  )
}
