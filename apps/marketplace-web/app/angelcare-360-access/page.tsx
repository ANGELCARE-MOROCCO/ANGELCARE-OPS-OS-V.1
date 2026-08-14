import { getAngelcare360CustomerBroadcastSnapshot } from '@/lib/angelcare360/customer-broadcasts'
import { SanilaMasterGateway } from '@/components/angelcare360/gateway/SanilaMasterGateway'

export const dynamic = 'force-dynamic'

export default async function SanilaAccessGatewayPage() {
  const initialBroadcasts = await getAngelcare360CustomerBroadcastSnapshot()
  return <SanilaMasterGateway initialBroadcasts={initialBroadcasts} />
}
