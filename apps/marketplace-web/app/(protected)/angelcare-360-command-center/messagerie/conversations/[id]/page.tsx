import { notFound } from 'next/navigation'
import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import ConversationChamber from '@/components/angelcare360/communication-command/ConversationChamber'
import { getSanilaCommunicationReferences, getSanilaCommunicationThreadDetail } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const [detail,refs]=await Promise.all([getSanilaCommunicationThreadDetail(id),getSanilaCommunicationReferences()]);if(!detail)notFound();return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/conversations" title={`Conversation ${detail.thread.thread_code}`} description="Chambre relationnelle : voix du fil, contexte, responsabilité, pièces liées et cycle de vie dans un seul espace cohérent."><ConversationChamber thread={detail.thread} messages={detail.messages} preferences={detail.preferences} documents={detail.documents} staff={refs.staff}/></CommunicationSectionFrame>}
