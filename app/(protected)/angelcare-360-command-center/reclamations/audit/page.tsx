import Link from 'next/link'
import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimAuditDrawer from '@/components/angelcare360/claims/Angelcare360ClaimAuditDrawer'
import { listAngelcare360ClaimAuditEvents } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimAuditPage() {
  const context = await getAngelcare360ClaimsContext()
  const events = await listAngelcare360ClaimAuditEvents({ schoolId: context.school.id, filters: {} })

  return (
    <Angelcare360ClaimsSectionScreen
      title="Audit réclamations"
      description="Journal des opérations, assignations, résolutions et blocages de réclamations."
      actions={<Link href="/angelcare-360-command-center/reclamations" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360ClaimAuditDrawer events={events} />
    </Angelcare360ClaimsSectionScreen>
  )
}
