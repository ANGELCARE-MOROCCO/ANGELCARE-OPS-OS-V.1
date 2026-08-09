import type { MarketplaceModule, MarketplacePermission } from '@/angelcare-marketplace/domain/types'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listMarketplaceModules } from '@/angelcare-marketplace/server/repository'
import { WorkspaceHome } from '@/angelcare-marketplace/features/workspace/WorkspaceHome'
import { WorkspaceShell } from '@/angelcare-marketplace/shells/WorkspaceShell'

export const metadata = { title: 'Espace sécurisé' }

export default async function MarketplaceWorkspacePage() {
  const context = await requireMarketplacePageContext('marketplace.workspace.access')
  let modules: MarketplaceModule[] = []
  let dataAvailable = true
  try {
    modules = await listMarketplaceModules()
  } catch {
    dataAvailable = false
  }
  const authorizedModules = modules.filter((module) =>
    !module.required_permissions.length ||
    module.required_permissions.every((permission) =>
      context.permissions.includes(permission as MarketplacePermission),
    ),
  )
  return (
    <WorkspaceShell context={context}>
      <WorkspaceHome context={context} modules={authorizedModules} dataAvailable={dataAvailable} />
    </WorkspaceShell>
  )
}
