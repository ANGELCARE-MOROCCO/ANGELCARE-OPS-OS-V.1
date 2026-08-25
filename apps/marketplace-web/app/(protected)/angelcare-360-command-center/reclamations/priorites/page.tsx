import TrustResolutionShell from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionShell'
import { TrustPriorityBoard } from '@/components/angelcare360/claims/sovereign-reintegration/TrustResolutionViews'
import { getTrustResolutionSnapshot } from '@/lib/angelcare360/server/trust-resolution-command'
export const dynamic='force-dynamic'
export default async function ReclamationsPrioritesPage(){const snapshot=await getTrustResolutionSnapshot();return <TrustResolutionShell eyebrow="Priority Command" title="Priorités de résolution" description="Une vue de commandement par criticité réelle, responsabilité et retard — sans score artificiel ni analyse prédictive inventée."><TrustPriorityBoard snapshot={snapshot}/></TrustResolutionShell>}
