import HRCommandScreens from '../_components/HRCommandScreens'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'
import HRRealtimeSyncPanel from '@/components/hr-production/HRRealtimeSyncPanel'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getHRDashboardData()
  return <>
    <div className="fixed inset-x-5 top-[124px] z-[80]"><HRModuleCommandBridge context="Leave Management" compact />
      <HRRealtimeSyncPanel domain="leave" title="Leave realtime sync" compact /></div>
    <HRCommandScreens variant="leave" data={data as any} />
  </>
}
