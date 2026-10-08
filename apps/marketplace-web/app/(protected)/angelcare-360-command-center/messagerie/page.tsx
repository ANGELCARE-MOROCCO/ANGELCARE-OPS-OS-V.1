import SanilaCommunicationCommand from '@/components/angelcare360/communication-command/SanilaCommunicationCommand'
import { getSanilaCommunicationDashboard } from '@/lib/angelcare360/server/communication-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function Page(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/messagerie');const snapshot=await getSanilaCommunicationDashboard();return <SanilaCommunicationCommand snapshot={snapshot}/>}
