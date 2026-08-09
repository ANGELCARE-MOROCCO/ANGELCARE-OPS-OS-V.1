import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { TerritoryCommandCockpit } from '@/angelcare-marketplace/territory-os/components/TerritoryCommandCockpit'
import { countOpenCriticalTerritoryEvents, listRecentTerritoryHealthEvents, listTerritories, summarizeTerritories } from '@/angelcare-marketplace/territory-os/repository'

export const metadata = { title: 'Territory Command' }
export default async function TerritoryCommandPage() {
  const context = await requireMarketplacePageContext('marketplace.territories.view')
  const [territories, critical, recentEvents] = await Promise.all([
    listTerritories(context), countOpenCriticalTerritoryEvents(context), listRecentTerritoryHealthEvents(context, 10),
  ])
  return <TerritoryCommandCockpit territories={territories} summary={summarizeTerritories(territories, critical)} recentEvents={recentEvents} />
}
