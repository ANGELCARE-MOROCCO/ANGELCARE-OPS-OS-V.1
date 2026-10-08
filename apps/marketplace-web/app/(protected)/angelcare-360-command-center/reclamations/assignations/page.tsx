import TrustResolutionShell from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionShell'
import { TrustOwnershipBoard } from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionViews'
import { getTrustResolutionSnapshot } from '@/lib/angelcare360/server/trust-resolution-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function ReclamationsAssignationsPage(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/reclamations/assignations');const snapshot=await getTrustResolutionSnapshot();return <TrustResolutionShell eyebrow="Ownership Control" title="Responsabilités & assignations" description="Repérez immédiatement les dossiers sans propriétaire et la charge opérationnelle réelle de chaque responsable."><TrustOwnershipBoard snapshot={snapshot}/></TrustResolutionShell>}
