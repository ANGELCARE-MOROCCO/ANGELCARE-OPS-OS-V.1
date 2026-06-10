import { CareLinkOpsProductionDashboard } from '@/components/carelink/ops/CareLinkOpsProductionDashboard'
import { buildCareLinkOpsDashboard } from '@/lib/carelink/ops-dashboard-data'

export const dynamic = 'force-dynamic'

export default function CareLinkOpsPage() {
  return <CareLinkOpsProductionDashboard initialPayload={buildCareLinkOpsDashboard()} />
}
