import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { StopsCommand } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Arrêts" subtitle="Stop Sequence Control · ordre, heure planifiée et localisation"><StopsCommand snapshot={snapshot}/></TransportCommandShell>}
