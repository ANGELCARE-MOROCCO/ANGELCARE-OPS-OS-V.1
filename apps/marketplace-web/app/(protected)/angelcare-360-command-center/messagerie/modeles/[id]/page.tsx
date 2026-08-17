import { notFound } from 'next/navigation'
import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import TemplateChamber from '@/components/angelcare360/communication-command/TemplateChamber'
import { getSanilaCommunicationTemplateDetail } from '@/lib/angelcare360/server/communication-command'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const detail=await getSanilaCommunicationTemplateDetail(id);if(!detail)notFound();return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/modeles" title="Template Chamber" description="Version, variables et rendu contrôlé du patrimoine éditorial institutionnel."><TemplateChamber template={detail.template} versions={detail.versions}/></CommunicationSectionFrame>}
