import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { RunsBoard } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export default async function Page(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/transport/courses');const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Courses" subtitle="Daily Movement Board · exécution enregistrée, sans faux GPS live"><RunsBoard snapshot={snapshot}/></TransportCommandShell>}
