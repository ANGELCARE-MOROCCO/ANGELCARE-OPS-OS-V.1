import TrustResolutionShell from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionShell'
import { TrustCaseRegistry } from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionViews'
import { getTrustResolutionSnapshot } from '@/lib/angelcare360/server/trust-resolution-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function ReclamationsTicketsPage(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/reclamations/tickets');const snapshot=await getTrustResolutionSnapshot();return <TrustResolutionShell eyebrow="Case Registry" title="Dossiers de réclamation" description="Registre opérationnel de tous les dossiers avec contexte famille/élève, responsabilité, priorité, temps écoulé, échéance et accès au dossier de résolution."><TrustCaseRegistry snapshot={snapshot}/></TrustResolutionShell>}
