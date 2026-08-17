import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { MobilityForensics } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Audit" subtitle="Mobility Forensics · responsabilité, chronologie et mémoire opérationnelle"><MobilityForensics snapshot={snapshot}/></TransportCommandShell>}
