import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { PickupControl } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Ramassage" subtitle="Pickup Operations · montée, absence et arrêts enregistrés"><PickupControl snapshot={snapshot}/></TransportCommandShell>}
