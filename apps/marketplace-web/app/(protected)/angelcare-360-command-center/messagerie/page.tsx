import SanilaCommunicationCommand from '@/components/angelcare360/communication-command/SanilaCommunicationCommand'
import { getSanilaCommunicationDashboard } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page(){const snapshot=await getSanilaCommunicationDashboard();return <SanilaCommunicationCommand snapshot={snapshot}/>}
