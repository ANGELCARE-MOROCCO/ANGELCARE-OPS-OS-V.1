import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { RoutesCommand } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Circuits" subtitle="Route Command · conception, arrêts, affectations et préparation"><RoutesCommand snapshot={snapshot}/></TransportCommandShell>}
