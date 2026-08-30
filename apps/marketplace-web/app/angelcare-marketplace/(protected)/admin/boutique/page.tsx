import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FrontendControlCommand } from '@/angelcare-marketplace/total-commerce-control/components/FrontendControlCommand'
import { frontendControlSnapshot } from '@/angelcare-marketplace/total-commerce-control/repository'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.commerce.view')
  return <FrontendControlCommand snapshot={await frontendControlSnapshot()} />
}
