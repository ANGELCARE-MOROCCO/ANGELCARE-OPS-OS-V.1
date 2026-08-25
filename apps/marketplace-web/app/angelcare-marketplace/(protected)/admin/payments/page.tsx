import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminPaymentSummary } from '@/angelcare-marketplace/admin-control-plane/repository'
import { PaymentCommand } from '@/angelcare-marketplace/admin-control-plane/components/PaymentCommand'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.finance.view')
  return <PaymentCommand initial={await adminPaymentSummary()} />
}
