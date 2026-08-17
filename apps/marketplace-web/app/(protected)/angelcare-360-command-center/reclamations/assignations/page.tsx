import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimAssignmentsWorkspace from '@/components/angelcare360/claims/Angelcare360ClaimAssignmentsWorkspace'
import { listAngelcare360ClaimAssignments } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimAssignmentsPage() {
  const context = await getAngelcare360ClaimsContext()
  const assignments = await listAngelcare360ClaimAssignments({ schoolId: context.school.id })
  return <Angelcare360ClaimsSectionScreen
    title="Responsabilités & prise en charge"
    description="Visualiser qui porte quoi, où une responsabilité manque et quels dossiers sont bloqués dans une dépendance. Aucun classement individuel fictif."
    eyebrow="TRUST RESOLUTION · RESPONSIBILITY COMMAND"
    activeHref="/angelcare-360-command-center/reclamations/assignations"
  ><Angelcare360ClaimAssignmentsWorkspace assignments={assignments} /></Angelcare360ClaimsSectionScreen>
}
