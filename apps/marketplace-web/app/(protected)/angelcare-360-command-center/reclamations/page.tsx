import Angelcare360TrustResolutionCommand from '@/components/angelcare360/claims/Angelcare360TrustResolutionCommand'
import { getAngelcare360ClaimsOverview, listAngelcare360ClaimTickets } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ReclamationsPage() {
  const context = await getAngelcare360ClaimsContext()
  const [claims, claimTickets] = await Promise.all([
    getAngelcare360ClaimsOverview({ schoolId: context.school.id }),
    listAngelcare360ClaimTickets({ schoolId: context.school.id }),
  ])

  const snapshot = {
    schoolName: context.school.name,
    academicYearLabel: context.academicYear?.label || 'Année scolaire active non renseignée',
    generatedAt: new Date().toISOString(),
    claims,
    claimTickets,
    sourceWarnings: claims.risks || [],
  }

  return <Angelcare360TrustResolutionCommand snapshot={snapshot} />
}
