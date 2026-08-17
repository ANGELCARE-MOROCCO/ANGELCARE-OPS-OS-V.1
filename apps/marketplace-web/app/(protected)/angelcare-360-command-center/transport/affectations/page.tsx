import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { AssignmentsMatrix } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
export default async function Page(){const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Affectations" subtitle="Student Mobility Matrix · élève, circuit, arrêt et direction de service"><AssignmentsMatrix snapshot={snapshot}/></TransportCommandShell>}
