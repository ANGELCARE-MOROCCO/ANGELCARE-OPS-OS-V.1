import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { RunsBoard } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Courses" subtitle="Daily Movement Board · exécution enregistrée, sans faux GPS live"><RunsBoard snapshot={snapshot}/></TransportCommandShell>}
