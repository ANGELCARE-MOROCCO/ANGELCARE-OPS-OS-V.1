import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminPaymentSummary } from '@/angelcare-marketplace/admin-control-plane/repository'
import { PaymentCommand } from '@/angelcare-marketplace/admin-control-plane/components/PaymentCommand'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const context = await requireMarketplacePageContext('marketplace.finance.view')
  return <PaymentCommand initial={await adminPaymentSummary()} canCreate={hasMarketplacePermission(context,'marketplace.finance.manage')} canManage={hasMarketplacePermission(context,'marketplace.finance.exceptions.approve')} canRefund={hasMarketplacePermission(context,'marketplace.finance.exceptions.approve')} />
}
