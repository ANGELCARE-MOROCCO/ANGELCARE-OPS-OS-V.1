import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { LiveProofSources } from '@/angelcare-marketplace/live-experience-command/components/LiveProofSources'
import { liveExperienceSummary, safeLiveSource } from '@/angelcare-marketplace/live-experience-command/repository'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.live_experience.view');const summary=await liveExperienceSummary(context);return <LiveProofSources initialSources={summary.sources.map(safeLiveSource)} campaigns={summary.campaigns.filter(campaign=>campaign.kind==='proof')} canManage={hasMarketplacePermission(context,'marketplace.proof_widget.manage')}/>}
