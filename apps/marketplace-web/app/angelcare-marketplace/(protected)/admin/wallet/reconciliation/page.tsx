import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminWalletCommand } from '@/angelcare-marketplace/customer-commerce/admin-repository'
import { AdminWalletCommand } from '@/angelcare-marketplace/customer-commerce/components/AdminWalletCommand'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.reconciliation.manage');return <AdminWalletCommand summary={await adminWalletCommand(context)}/>}
