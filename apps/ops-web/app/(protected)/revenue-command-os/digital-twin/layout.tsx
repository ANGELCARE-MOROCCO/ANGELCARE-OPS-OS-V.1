import { requireAccess } from '@/lib/auth/requireAccess'
import { readRevenueDigitalTwin } from '@/lib/revenue-command-os/digital-twin/repository'
import { DigitalTwinProvider } from './_components/DigitalTwinContext'
import DigitalTwinFrame from './_components/DigitalTwinFrame'

export const dynamic = 'force-dynamic'

export default async function RevenueDigitalTwinLayout({ children }: { children: React.ReactNode }) {
  await requireAccess(['revenue_os.digital_twin.manage', 'revenue_os.view', 'revenue.view'])
  const { bootstrap } = await readRevenueDigitalTwin()
  return <DigitalTwinProvider initialTwin={bootstrap}><DigitalTwinFrame>{children}</DigitalTwinFrame></DigitalTwinProvider>
}
