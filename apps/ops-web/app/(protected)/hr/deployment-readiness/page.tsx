import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { HR_FINAL_ROUTES } from '@/lib/hr-unified/max-phase12-final-routes'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default function HRDeploymentReadinessPage() {
  const checks = [
    ['Run final script', 'scripts/APPLY_HR_V3_MAX_PHASE12.sh', 'required'],
    ['Run final SQL', '115_hr_v3_max_phase12_final_production_stabilization.sql', 'required'],
    ['Clean build', 'rm -rf .next && npm run build', 'required'],
    ['Route smoke test', '/hr/final-route-audit', 'required'],
    ['Vercel deployment', 'push to Git after build passes', 'final'],
  ]

  const metrics = [
    { label: 'Final phase', value: 12, detail: 'Production stabilization', tone: '#2563eb' },
    { label: 'Routes', value: HR_FINAL_ROUTES.length, detail: 'Final manifest size', tone: '#059669' },
    { label: 'Build target', value: 'PASS', detail: 'Strict TypeScript target', tone: '#7c3aed' },
    { label: 'Deploy state', value: 'READY', detail: 'After clean build', tone: '#ea580c' },
  ]

  return (
    <AppShell title="HR Deployment Readiness" subtitle="Final deployment checklist for HR MAX." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Deployment Readiness' }]} actions={<PageAction href="/hr/final-qa" variant="light">Final QA</PageAction>}>
      <HRHero title="HR MAX Deployment Readiness" subtitle="Final production checklist: script, SQL, clean build, route smoke test and Vercel deployment readiness." />
      <HRGrid min={210}>{metrics.map((m) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Deployment checklist" subtitle="Follow this order exactly.">
        {checks.map(([title, meta, status]) => (
          <HRRow key={title} title={title} meta={meta} status={status} />
        ))}
      </HRPanel>
    </AppShell>
  )
}
