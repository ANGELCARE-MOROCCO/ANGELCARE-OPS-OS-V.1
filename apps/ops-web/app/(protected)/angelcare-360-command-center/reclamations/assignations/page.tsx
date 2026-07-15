import Link from 'next/link'
import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimAssignmentsWorkspace from '@/components/angelcare360/claims/Angelcare360ClaimAssignmentsWorkspace'
import { listAngelcare360ClaimAssignments } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimAssignmentsPage() {
  const context = await getAngelcare360ClaimsContext()
  const assignments = await listAngelcare360ClaimAssignments({ schoolId: context.school.id })

  return (
    <Angelcare360ClaimsSectionScreen
      title="Assignations"
      description="Tickets affectés et charge de traitement par personnel."
      actions={<Link href="/angelcare-360-command-center/reclamations" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360ClaimAssignmentsWorkspace assignments={assignments} />
    </Angelcare360ClaimsSectionScreen>
  )
}

