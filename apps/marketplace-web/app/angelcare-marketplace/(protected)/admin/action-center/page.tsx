import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { ActionCenter } from '@/angelcare-marketplace/sovereign-control/components/ActionCenter'
import { listActions } from '@/angelcare-marketplace/sovereign-control/repository'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.backoffice.actions.view')
  return <><PageHeader eyebrow="EXECUTION OWNERSHIP" title="Centre d’action" description="Chaque blocage devient une action affectée, datée, mesurable et traçable."/><ActionCenter initialActions={await listActions()} /></>
}
