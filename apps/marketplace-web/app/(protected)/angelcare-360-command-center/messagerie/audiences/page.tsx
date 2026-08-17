import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import AudienceStudio from '@/components/angelcare360/communication-command/AudienceStudio'
import { getSanilaCommunicationReferences, listSanilaAudienceSegments } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page(){const [segments,refs]=await Promise.all([listSanilaAudienceSegments(),getSanilaCommunicationReferences()]);return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/audiences" title="Audience Studio" description="Construire des audiences inspectables et matérialisées, sans population cachée ni estimation inventée."><AudienceStudio segments={segments} guardians={refs.guardians} students={refs.students} staff={refs.staff} campuses={refs.campuses}/></CommunicationSectionFrame>}
