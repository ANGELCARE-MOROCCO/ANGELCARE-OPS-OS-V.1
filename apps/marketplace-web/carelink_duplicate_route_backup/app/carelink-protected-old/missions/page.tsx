import { CareLinkMobileClient } from '@/components/carelink/CareLinkMobileClient'
import { loadCarelinkDashboard } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

export default async function CareLinkMissionsPage() {
  const { data } = await loadCarelinkDashboard()
  return <CareLinkMobileClient initialDashboard={data} view="missions" />
}
