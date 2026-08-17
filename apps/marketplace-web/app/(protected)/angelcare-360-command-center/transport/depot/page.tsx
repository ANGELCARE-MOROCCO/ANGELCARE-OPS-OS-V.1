import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { DropoffControl } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Dépôt" subtitle="Dropoff Operations · dépôt confirmé et chronologie réelle"><DropoffControl snapshot={snapshot}/></TransportCommandShell>}
