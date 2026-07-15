import HRCommandScreens from '../_components/HRCommandScreens'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'
import HRRealtimeSyncPanel from '@/components/hr-production/HRRealtimeSyncPanel'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getHRDashboardData()
  return <>
    <div className="fixed inset-x-5 top-[124px] z-[80]"><HRModuleCommandBridge context="HR Documents" compact />
      <HRRealtimeSyncPanel domain="documents" title="Documents realtime sync" compact /></div>
    <HRCommandScreens variant="documents" data={data as any} />
  </>
}
