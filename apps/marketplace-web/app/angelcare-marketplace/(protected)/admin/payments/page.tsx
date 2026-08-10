import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { paymentAdminSummary } from '@/angelcare-marketplace/customer-commerce/payment-admin'
import { PaymentAdminCommand } from '@/angelcare-marketplace/customer-commerce/components/PaymentAdminCommand'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');return <PaymentAdminCommand initial={await paymentAdminSummary(context)}/>}
