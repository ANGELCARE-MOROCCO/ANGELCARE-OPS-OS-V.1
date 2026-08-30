import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PayPalOperations } from '@/angelcare-marketplace/customer-commerce/components/PayPalOperations'
import { paypalAdminHealth } from '@/angelcare-marketplace/customer-commerce/paypal-admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'PayPal Operations' }
export default async function Page() {
  const context = await requireMarketplacePageContext('marketplace.configuration.view')
  return <PayPalOperations initial={await paypalAdminHealth()} canManage={hasMarketplacePermission(context, 'marketplace.configuration.manage')}/>
}
