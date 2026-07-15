import HRCommandScreens from '../_components/HRCommandScreens'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getHRDashboardData()
  return <>
    <div className="fixed inset-x-5 top-[124px] z-[80]"><HRModuleCommandBridge context="HR Sync Center" compact /></div>
    <HRCommandScreens variant="sync" data={data as any} />
  </>
}
