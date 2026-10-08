import CommunicationSectionFrame from '@/components/angelcare360/communication-command/CommunicationSectionFrame'
import PreferencesCommand from '@/components/angelcare360/communication-command/PreferencesCommand'
import { getSanilaCommunicationReferences, listSanilaCommunicationPreferences } from '@/lib/angelcare360/server/communication-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function Page(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/messagerie/preferences');const [preferences,refs]=await Promise.all([listSanilaCommunicationPreferences(),getSanilaCommunicationReferences()]);return <CommunicationSectionFrame active="/angelcare-360-command-center/messagerie/preferences" title="Préférences & consentement" description="Gouvernance des canaux destinataires, consentement et langue, séparée de la disponibilité réelle des fournisseurs."><PreferencesCommand preferences={preferences} guardians={refs.guardians} staff={refs.staff}/></CommunicationSectionFrame>}
