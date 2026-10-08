import type { MarketplaceConfiguration } from '@/angelcare-marketplace/domain/types'
import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FoundationUnavailable } from '@/angelcare-marketplace/components/FoundationUnavailable'
import { ConfigurationClient } from '@/angelcare-marketplace/features/admin/ConfigurationClient'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { listMarketplaceConfigurations, listMarketplaceModules, listMarketplaceReadiness } from '@/angelcare-marketplace/server/repository'
import { GovernanceCommand } from '@/angelcare-marketplace/shells/GovernanceCommand'

export const metadata = { title: 'Configuration' }

export default async function MarketplaceConfigurationPage() {
  const context = await requireMarketplacePageContext('marketplace.configuration.view')
  let configurations: MarketplaceConfiguration[] = []
  let modules: Awaited<ReturnType<typeof listMarketplaceModules>> = []
  let readiness: Awaited<ReturnType<typeof listMarketplaceReadiness>> = []
  let available = true
  try { [configurations,modules,readiness] = await Promise.all([listMarketplaceConfigurations(),listMarketplaceModules(),listMarketplaceReadiness()]) } catch { available = false }
  return (
    <>
      <GovernanceCommand configurations={configurations} modules={modules} readiness={readiness} />
      <PageHeader
        eyebrow="Configuration gouvernée"
        title="Paramètres de fondation"
        description="Les paramètres métier autorisés peuvent être modifiés avec validation et justification. Les secrets et valeurs serveur restent protégés et ne sont jamais exposés."
      />
      {available
        ? <ConfigurationClient initialConfigurations={configurations} canManage={hasMarketplacePermission(context,'marketplace.configuration.manage')} />
        : <FoundationUnavailable />}
    </>
  )
}
