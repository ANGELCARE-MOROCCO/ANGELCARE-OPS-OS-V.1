import Link from 'next/link'
import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimPriorityWorkspace from '@/components/angelcare360/claims/Angelcare360ClaimPriorityWorkspace'
import { listAngelcare360ClaimPriorityView } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimPriorityPage() {
  const context = await getAngelcare360ClaimsContext()
  const tickets = await listAngelcare360ClaimPriorityView({ schoolId: context.school.id })

  return (
    <Angelcare360ClaimsSectionScreen
      title="Priorités"
      description="Lecture des tickets par priorité et ancienneté."
      actions={<Link href="/angelcare-360-command-center/reclamations" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360ClaimPriorityWorkspace tickets={tickets} />
    </Angelcare360ClaimsSectionScreen>
  )
}

