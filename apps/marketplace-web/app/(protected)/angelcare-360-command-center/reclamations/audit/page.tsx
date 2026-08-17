import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimAuditDrawer from '@/components/angelcare360/claims/Angelcare360ClaimAuditDrawer'
import { listAngelcare360ClaimAuditEvents } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimAuditPage() {
  const context = await getAngelcare360ClaimsContext()
  const events = await listAngelcare360ClaimAuditEvents({ schoolId: context.school.id, filters: {} })
  return <Angelcare360ClaimsSectionScreen
    title="Mémoire d’audit"
    description="Chronologie forensique des créations, responsabilités, transitions, résolutions et clôtures. Une mémoire de gouvernance, pas une table de logs brute."
    eyebrow="TRUST RESOLUTION · INSTITUTIONAL MEMORY"
    activeHref="/angelcare-360-command-center/reclamations/audit"
  ><Angelcare360ClaimAuditDrawer events={events} /></Angelcare360ClaimsSectionScreen>
}
