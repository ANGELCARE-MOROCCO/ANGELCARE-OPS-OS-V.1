import { notFound } from 'next/navigation'
import Angelcare360OperatorHub from '@/components/angelcare360/operator/Angelcare360OperatorHub'
import { getOperatorOverview } from '@/lib/angelcare360/operator/overview'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const overview = await getOperatorOverview()
  return <Angelcare360OperatorHub overview={overview} />
}

