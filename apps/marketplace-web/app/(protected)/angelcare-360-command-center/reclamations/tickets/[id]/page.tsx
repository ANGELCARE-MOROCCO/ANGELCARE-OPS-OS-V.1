import { notFound } from 'next/navigation'
import TrustResolutionShell from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionShell'
import { TrustCaseDossier } from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionViews'
import { getTrustResolutionCase } from '@/lib/angelcare360/server/trust-resolution-command'
export const dynamic='force-dynamic'
export default async function ReclamationDossierPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const dossier=await getTrustResolutionCase(id);if(!dossier)notFound();return <TrustResolutionShell eyebrow="Trust Resolution Dossier" title={`${dossier.item.code} · ${dossier.item.subject}`} description="Le dossier réunit la vérité opérationnelle : contexte, chronologie, responsabilité, notes internes, communications enregistrées, prochaine action, résolution et audit."><TrustCaseDossier snapshot={dossier.snapshot} item={dossier.item} chronology={dossier.chronology}/></TrustResolutionShell>}
