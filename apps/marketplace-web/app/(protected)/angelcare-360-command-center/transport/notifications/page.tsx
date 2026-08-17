import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { NotificationsTruth } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Notifications" subtitle="Commercial Truth · événement interne ≠ livraison parent externe"><NotificationsTruth snapshot={snapshot}/></TransportCommandShell>}
