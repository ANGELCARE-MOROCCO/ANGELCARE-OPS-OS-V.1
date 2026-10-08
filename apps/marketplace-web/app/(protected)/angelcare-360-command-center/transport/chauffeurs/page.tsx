import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { DriversCommand } from '@/components/angelcare360/transport-command/TransportViews'
import { loadTransportSnapshot } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export default async function Page(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/transport/chauffeurs');const snapshot=await loadTransportSnapshot();return <TransportCommandShell schoolName={snapshot.schoolName} title="Chauffeurs" subtitle="Driver Readiness · permis, disponibilité et responsabilité"><DriversCommand snapshot={snapshot}/></TransportCommandShell>}
