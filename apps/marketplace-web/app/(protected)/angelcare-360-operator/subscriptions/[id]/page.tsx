import { notFound } from 'next/navigation'
import SubscriptionControlRoom from '@/components/angelcare360/operator/wave2/SubscriptionControlRoom'
import { loadWave2SubscriptionCommand } from '@/components/angelcare360/operator/wave2/Wave2CommandData'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ id: string }> }
export default async function Angelcare360OperatorSubscriptionCommandPage({ params }: PageProps) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const { id } = await params
  const command = await loadWave2SubscriptionCommand(id)
  if (!command) notFound()
  return <SubscriptionControlRoom command={command} />
}
