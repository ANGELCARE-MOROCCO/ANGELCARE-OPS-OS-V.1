import { notFound } from 'next/navigation'
import RenewalStrategyRoom from '@/components/angelcare360/operator/wave2/RenewalStrategyRoom'
import { loadWave2RenewalCommand } from '@/components/angelcare360/operator/wave2/Wave2CommandData'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ id: string }> }
export default async function Angelcare360OperatorRenewalStrategyPage({ params }: PageProps) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const { id } = await params
  const command = await loadWave2RenewalCommand(id)
  if (!command) notFound()
  return <RenewalStrategyRoom command={command} />
}
