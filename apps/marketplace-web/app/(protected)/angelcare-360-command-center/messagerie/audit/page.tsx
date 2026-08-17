import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import CommunicationAudit from '@/components/angelcare360/communication-command/CommunicationAudit'
import { listSanilaCommunicationAudit } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page(){const events=await listSanilaCommunicationAudit();return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/audit" title="Communication Forensics" description="Audit des mutations, responsabilités et décisions liées au domaine de communication."><CommunicationAudit events={events}/></CommunicationSectionFrame>}
