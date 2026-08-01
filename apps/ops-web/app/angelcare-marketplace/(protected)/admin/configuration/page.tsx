import type { MarketplaceConfiguration } from '@/angelcare-marketplace/domain/types'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FoundationUnavailable } from '@/angelcare-marketplace/components/FoundationUnavailable'
import { ConfigurationClient } from '@/angelcare-marketplace/features/admin/ConfigurationClient'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { listMarketplaceConfigurations } from '@/angelcare-marketplace/server/repository'

export const metadata = { title: 'Configuration' }

export default async function MarketplaceConfigurationPage() {
  const context = await requireMarketplacePageContext('marketplace.configuration.view')
  let configurations: MarketplaceConfiguration[] = []
  let available = true
  try { configurations = await listMarketplaceConfigurations() } catch { available = false }
  return (
    <>
      <PageHeader
        eyebrow="Configuration gouvernée"
        title="Paramètres de fondation"
        description="Les paramètres métier autorisés peuvent être modifiés avec validation et justification. Les secrets et valeurs serveur restent protégés et ne sont jamais exposés."
      />
      {available
        ? <ConfigurationClient initialConfigurations={configurations} canManage={context.permissions.includes('marketplace.configuration.manage')} />
        : <FoundationUnavailable />}
    </>
  )
}
