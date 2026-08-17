import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { IncidentCommand } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Incidents" subtitle="Incident Truth · courses, événements et contrôles en anomalie"><IncidentCommand snapshot={snapshot}/></TransportCommandShell>}
