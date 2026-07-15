import HRCommandScreens from '../_components/HRCommandScreens'
import { getHRDashboardData } from '@/lib/hr-production/repository'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getHRDashboardData()
  return <HRCommandScreens variant="sync" data={data as any} />
}
