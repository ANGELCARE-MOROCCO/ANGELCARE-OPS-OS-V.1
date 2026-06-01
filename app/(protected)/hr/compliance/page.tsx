import HRCommandScreens from '../_components/HRCommandScreens'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import HRRealtimeSyncPanel from '@/components/hr-production/HRRealtimeSyncPanel'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getHRDashboardData()
  return <>
    <HRRealtimeSyncPanel domain="compliance" title="Compliance realtime sync" compact />
    <HRCommandScreens variant="compliance" data={data as any} />
  </>
}
