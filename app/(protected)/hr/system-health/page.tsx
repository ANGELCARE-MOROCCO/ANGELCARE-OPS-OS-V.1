import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { getHRProductionScore } from '@/lib/hr-production/metrics'
import { scanHRDataQuality } from '@/lib/hr-production/data-quality'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'

export default async function Page() {
  const data = await getHRDashboardData()
  const findings = scanHRDataQuality(data)
  const score = getHRProductionScore(data)
  const checks = [
    ['Unified schema', 'ready', 'Core production tables and compatibility views installed.'],
    ['Server actions', 'ready', 'CRUD, status changes and audit logging available.'],
    ['Data quality', findings.length ? 'attention' : 'ready', `${findings.length} open finding(s).`],
    ['Exports', 'ready', 'CSV export endpoint available.'],
    ['Sync readiness', data.syncEvents.length ? 'active' : 'needs activity', 'Track sync events from HR to other modules.'],
  ]
  return <AppShell title="HR System Health" subtitle="Production stabilization scorecard." breadcrumbs={[{label:'HR',href:'/hr'},{label:'System health'}]}>
    <div className="space-y-6"><HRModuleCommandBridge context="HR System Health" compact /><HRCard title="Production score" value={`${score}%`} /><HRSection title="Health checks"><HRTable headers={['Check','Status','Detail']} rows={checks.map((x)=>[x[0], <HRStatusPill value={x[1]} />, x[2]])} /></HRSection></div>
  </AppShell>
}
