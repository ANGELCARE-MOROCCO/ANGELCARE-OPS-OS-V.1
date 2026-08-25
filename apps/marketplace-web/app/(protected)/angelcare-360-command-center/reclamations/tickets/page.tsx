import TrustResolutionShell from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionShell'
import { TrustCaseRegistry } from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionViews'
import { getTrustResolutionSnapshot } from '@/lib/angelcare360/server/trust-resolution-command'
export const dynamic='force-dynamic'
export default async function ReclamationsTicketsPage(){const snapshot=await getTrustResolutionSnapshot();return <TrustResolutionShell eyebrow="Case Registry" title="Dossiers de réclamation" description="Registre opérationnel de tous les dossiers avec contexte famille/élève, responsabilité, priorité, temps écoulé, échéance et accès au dossier de résolution."><TrustCaseRegistry snapshot={snapshot}/></TrustResolutionShell>}
