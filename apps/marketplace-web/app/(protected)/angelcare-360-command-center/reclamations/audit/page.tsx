import TrustResolutionShell from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionShell'
import { TrustForensics } from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionViews'
import { getTrustResolutionSnapshot } from '@/lib/angelcare360/server/trust-resolution-command'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function ReclamationsAuditPage(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/reclamations/audit');const snapshot=await getTrustResolutionSnapshot();return <TrustResolutionShell eyebrow="Trust Forensics" title="Audit & traçabilité" description="Reconstituez les actions réellement enregistrées sur les dossiers Réclamations : création, affectation, changements, notes, communication et résolution."><TrustForensics snapshot={snapshot}/></TrustResolutionShell>}
