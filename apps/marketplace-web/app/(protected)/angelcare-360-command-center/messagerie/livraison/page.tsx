import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import DeliveryCommand from '@/components/angelcare360/communication-command/DeliveryCommand'
import { listSanilaDeliveryCommand } from '@/lib/angelcare360/server/communication-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function Page(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/messagerie/livraison');const d=await listSanilaDeliveryCommand();return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/livraison" title="Delivery Truth" description="Registre de file, dispatch, livraison, lecture et échec sans jamais transformer un état technique en promesse client."><DeliveryCommand jobs={d.jobs} events={d.events} recipients={d.recipients}/></CommunicationSectionFrame>}
