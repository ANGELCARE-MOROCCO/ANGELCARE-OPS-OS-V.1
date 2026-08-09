import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ReadinessBoardClient } from '@/angelcare-marketplace/territory-os/components/ReadinessBoardClient'
import { calculateTerritoryReadiness } from '@/angelcare-marketplace/territory-os/readiness'
import { getTerritoryByCode, listTerritoryLaunchChecks } from '@/angelcare-marketplace/territory-os/repository'

export default async function Page({ params }: { params: Promise<{ territoryCode: string }> }) {
  const context = await requireMarketplacePageContext('marketplace.territory_readiness.view')
  const { territoryCode } = await params
  const territory = await getTerritoryByCode(context, territoryCode)
  const checks = await listTerritoryLaunchChecks(context, territory.id)
  return (
    <ReadinessBoardClient
      territory={territory}
      checks={checks}
      initialSummary={calculateTerritoryReadiness(checks)}
      canManage={hasMarketplacePermission(context, 'marketplace.territory_readiness.manage')}
      canReview={hasMarketplacePermission(context, 'marketplace.territory_readiness.review')}
      canSignOff={hasMarketplacePermission(context, 'marketplace.territory_readiness.sign_off')}
    />
  )
}
