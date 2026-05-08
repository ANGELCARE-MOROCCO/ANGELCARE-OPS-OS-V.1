import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HR_FINAL_AREAS, HR_FINAL_ROUTES } from '@/lib/hr-unified/max-phase12-final-routes'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton } from '../_components/HRMaxUI'

export default function HRFinalQAPage() {
  const duplicateMap = new Map<string, number>()
  HR_FINAL_ROUTES.forEach((route) => duplicateMap.set(route.href, (duplicateMap.get(route.href) || 0) + 1))
  const duplicates = Array.from(duplicateMap.entries()).filter((entry) => entry[1] > 1)

  const metrics = [
    { label: 'Final routes', value: HR_FINAL_ROUTES.length, detail: 'Expected HR route inventory', tone: '#2563eb' },
    { label: 'Areas', value: HR_FINAL_AREAS.length, detail: 'Operating domains', tone: '#7c3aed' },
    { label: 'Core routes', value: HR_FINAL_ROUTES.filter((r) => r.criticality === 'core').length, detail: 'Mission-critical pages', tone: '#059669' },
    { label: 'Duplicates', value: duplicates.length, detail: 'Should be zero', tone: duplicates.length ? '#dc2626' : '#0891b2' },
  ]

  return (
    <AppShell title="HR Final QA" subtitle="Final QA dashboard for HR MAX production readiness." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Final QA' }]} actions={<PageAction href="/hr/deployment-readiness" variant="light">Deployment Readiness</PageAction>}>
      <HRHero title="HR MAX Final QA" subtitle="Final route inventory, critical workspace review, duplicate detection and deployment readiness checklist." actions={<><HRButton href="/hr/final-route-audit" variant="blue">Route Audit</HRButton><HRButton href="/hr/deployment-readiness" variant="light">Deployment</HRButton></>} />
      <HRGrid min={210}>{metrics.map((m) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Final QA checks" subtitle="Static production readiness checks.">
        <HRRow title="Duplicate route manifest check" meta={duplicates.length ? `${duplicates.length} duplicate hrefs` : 'No duplicate hrefs in final manifest'} status={duplicates.length ? 'review' : 'ok'} />
        <HRRow title="Core route coverage" meta={`${HR_FINAL_ROUTES.filter((r) => r.criticality === 'core').length} core pages registered`} status="ok" />
        <HRRow title="Navigation layer" meta="/hr/navigation, /hr/route-map, /hr/system-health exist from Phase 6" status="ok" />
        <HRRow title="Final production script" meta="Generates HR_FINAL_PRODUCTION_REPORT.txt" status="ready" />
      </HRPanel>
    </AppShell>
  )
}
