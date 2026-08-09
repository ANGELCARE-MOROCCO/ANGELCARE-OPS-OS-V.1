import { requireMarketplacePageContext } from '../auth/context'
import { activationCommandData } from './repository'
import { ActivationCommand } from './components/ActivationCommand'

export async function ProductionActivationPage() {
  const context = await requireMarketplacePageContext('marketplace.commerce.view')
  return <ActivationCommand initialData={await activationCommandData(context)} />
}
