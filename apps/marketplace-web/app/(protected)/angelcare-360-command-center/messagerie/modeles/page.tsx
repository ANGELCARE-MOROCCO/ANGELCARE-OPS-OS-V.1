import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import TemplateAtelier from '@/components/angelcare360/communication-command/TemplateAtelier'
import { getSanilaCommunicationReferences, listSanilaCommunicationTemplates } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page(){const [templates,refs]=await Promise.all([listSanilaCommunicationTemplates(),getSanilaCommunicationReferences()]);return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/modeles" title="Template Atelier" description="Bibliothèque éditoriale contrôlée, versionnée et contextualisée par canal, audience et langue."><TemplateAtelier templates={templates} campuses={refs.campuses}/></CommunicationSectionFrame>}
