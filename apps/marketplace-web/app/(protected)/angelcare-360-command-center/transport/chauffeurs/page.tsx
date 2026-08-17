import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { DriversCommand } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Chauffeurs" subtitle="Driver Readiness · permis, disponibilité et responsabilité"><DriversCommand snapshot={snapshot}/></TransportCommandShell>}
