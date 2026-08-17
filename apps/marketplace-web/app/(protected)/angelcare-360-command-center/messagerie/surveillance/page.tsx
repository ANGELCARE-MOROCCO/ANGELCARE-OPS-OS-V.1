import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import Watchtower from '@/components/angelcare360/communication-command/Watchtower'
import { getSanilaCommunicationDashboard, listSanilaCommunicationAlerts } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page(){const [alerts,dashboard]=await Promise.all([listSanilaCommunicationAlerts(),getSanilaCommunicationDashboard()]);return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/surveillance" title="Communication Watchtower" description="Anomalies, fournisseurs, blocages et alertes de communication avec résolution documentée."><Watchtower alerts={alerts} readiness={dashboard.channelReadiness}/></CommunicationSectionFrame>}
