import type { MarketplaceFeatureFlag } from '@/angelcare-marketplace/domain/types'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FoundationUnavailable } from '@/angelcare-marketplace/components/FoundationUnavailable'
import { FeatureFlagsClient } from '@/angelcare-marketplace/features/admin/FeatureFlagsClient'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { listMarketplaceFeatureFlags } from '@/angelcare-marketplace/server/repository'

export const metadata = { title: 'Feature flags' }

export default async function MarketplaceFeatureFlagsPage() {
  const context = await requireMarketplacePageContext('marketplace.feature_flags.view')
  let flags: MarketplaceFeatureFlag[] = []
  let available = true
  try { flags = await listMarketplaceFeatureFlags() } catch { available = false }
  return (
    <>
      <PageHeader
        eyebrow="Activation contrôlée"
        title="Feature flags"
        description="Activer ou désactiver une capacité selon un périmètre explicite, une raison, une autorité et une preuve d’audit. Un flag ne masque jamais une livraison contractuelle absente."
      />
      {available
        ? <FeatureFlagsClient initialFlags={flags} canManage={context.permissions.includes('marketplace.feature_flags.manage')} />
        : <FoundationUnavailable />}
    </>
  )
}
