import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { FleetReadiness } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Flotte" subtitle="Fleet Readiness · capacité, assurance, inspection et disponibilité"><FleetReadiness snapshot={snapshot}/></TransportCommandShell>}
