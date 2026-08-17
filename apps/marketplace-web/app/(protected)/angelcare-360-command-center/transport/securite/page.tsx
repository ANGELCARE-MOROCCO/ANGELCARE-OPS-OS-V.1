import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { SafetyDepartureGate } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Sécurité" subtitle="Safety Departure Gate · contrôles, readiness et blocages réels"><SafetyDepartureGate snapshot={snapshot}/></TransportCommandShell>}
