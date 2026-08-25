import TrustResolutionShell from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionShell'
import { TrustOwnershipBoard } from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionViews'
import { getTrustResolutionSnapshot } from '@/lib/angelcare360/server/trust-resolution-command'
export const dynamic='force-dynamic'
export default async function ReclamationsAssignationsPage(){const snapshot=await getTrustResolutionSnapshot();return <TrustResolutionShell eyebrow="Ownership Control" title="Responsabilités & assignations" description="Repérez immédiatement les dossiers sans propriétaire et la charge opérationnelle réelle de chaque responsable."><TrustOwnershipBoard snapshot={snapshot}/></TrustResolutionShell>}
