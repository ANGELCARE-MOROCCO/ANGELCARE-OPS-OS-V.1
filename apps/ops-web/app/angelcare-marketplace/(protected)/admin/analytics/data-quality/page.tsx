import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listDataQuality } from '@/angelcare-marketplace/analytics-security/repository'
import { DataQualityCommand } from '@/angelcare-marketplace/analytics-security/components/MetricRegistry'
export default async function Page(){await requireMarketplacePageContext('marketplace.analytics.view');return <DataQualityCommand items={await listDataQuality()}/>}