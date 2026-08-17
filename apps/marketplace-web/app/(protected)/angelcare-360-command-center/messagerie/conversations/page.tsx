import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import ConversationsCommand from '@/components/angelcare360/communication-command/ConversationsCommand'
import { getSanilaCommunicationReferences, listSanilaCommunicationThreads } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page(){const [threads,refs]=await Promise.all([listSanilaCommunicationThreads({limit:180}),getSanilaCommunicationReferences()]);return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/conversations" title="Conversations" description="File opérationnelle, responsabilité et contexte relationnel. Chaque fil ouvre une chambre de conversation complète au lieu d’un modal de messagerie."><ConversationsCommand threads={threads} guardians={refs.guardians} students={refs.students} staff={refs.staff}/></CommunicationSectionFrame>}
