import { getStaff360 } from '@/lib/hr-production/repository'
import Staff360ProductionView from '@/components/hr-production/Staff360ProductionView'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getStaff360(id)
  return <Staff360ProductionView data={data} />
}
