import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { analyticsSummary,listSnapshots } from '@/angelcare-marketplace/analytics-security/repository'
import { AnalyticsCommand } from '@/angelcare-marketplace/analytics-security/components/AnalyticsCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.analytics.view');const [summary,snapshots]=await Promise.all([analyticsSummary(context),listSnapshots(context)]);return <AnalyticsCommand summary={summary} snapshots={snapshots}/>}