import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { MobilityCommandTheatre, Watchtower } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from './_utils'
export default async function TransportPage(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Transport" subtitle="Mobilité scolaire · exécution quotidienne · sécurité opérationnelle"><MobilityCommandTheatre snapshot={snapshot}/><Watchtower snapshot={snapshot}/></TransportCommandShell>}
