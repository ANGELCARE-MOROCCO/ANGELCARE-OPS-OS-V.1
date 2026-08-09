import type { MarketplaceModule } from '@/angelcare-marketplace/domain/types'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ModuleRegistryClient } from '@/angelcare-marketplace/features/admin/ModuleRegistryClient'
import { FoundationUnavailable } from '@/angelcare-marketplace/components/FoundationUnavailable'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { listMarketplaceModules } from '@/angelcare-marketplace/server/repository'

export const metadata = { title: 'Registre des modules' }

export default async function MarketplaceModulesPage() {
  const context = await requireMarketplacePageContext('marketplace.modules.view')
  let modules: MarketplaceModule[] = []
  let available = true
  try { modules = await listMarketplaceModules() } catch { available = false }
  return (
    <>
      <PageHeader
        eyebrow="Contrôle produit"
        title="Registre des modules"
        description="Source de vérité pour monter les Mega ZIPs futurs sans disperser la navigation, les permissions, les dépendances ou les statuts dans le code."
      />
      {available
        ? <ModuleRegistryClient initialModules={modules} permissions={context.permissions} />
        : <FoundationUnavailable />}
    </>
  )
}
