import { notFound } from 'next/navigation'
import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import AudienceChamber from '@/components/angelcare360/communication-command/AudienceChamber'
import { getSanilaAudienceSegmentDetail, getSanilaCommunicationReferences } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const [detail,refs]=await Promise.all([getSanilaAudienceSegmentDetail(id),getSanilaCommunicationReferences()]);if(!detail)notFound();return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/audiences" title="Audience Chamber" description="Population, coordonnées déclarées et gouvernance du segment sans population cachée."><AudienceChamber segment={detail.segment} members={detail.members} guardians={refs.guardians} students={refs.students} staff={refs.staff} campuses={refs.campuses}/></CommunicationSectionFrame>}
