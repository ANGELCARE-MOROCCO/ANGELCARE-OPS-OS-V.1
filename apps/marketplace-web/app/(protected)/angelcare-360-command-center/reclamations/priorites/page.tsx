import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimPriorityWorkspace from '@/components/angelcare360/claims/Angelcare360ClaimPriorityWorkspace'
import { listAngelcare360ClaimPriorityView } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimPriorityPage() {
  const context = await getAngelcare360ClaimsContext()
  const tickets = await listAngelcare360ClaimPriorityView({ schoolId: context.school.id })
  return <Angelcare360ClaimsSectionScreen
    title="Priorités & horizon temporel"
    description="Croiser priorité réelle et ancienneté persistée pour faire émerger les dossiers qui vieillissent. Aucun faux compte à rebours SLA n’est présenté sans échéance canonique."
    eyebrow="TRUST RESOLUTION · TIME HORIZON"
    activeHref="/angelcare-360-command-center/reclamations/priorites"
  ><Angelcare360ClaimPriorityWorkspace tickets={tickets} /></Angelcare360ClaimsSectionScreen>
}
