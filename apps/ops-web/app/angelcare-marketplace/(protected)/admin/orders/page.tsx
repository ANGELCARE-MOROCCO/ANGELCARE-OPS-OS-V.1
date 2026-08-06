import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminOrderCommand } from '@/angelcare-marketplace/customer-commerce/admin-repository'
import { EnterpriseOrderCommand } from '@/angelcare-marketplace/customer-commerce/components/EnterpriseOrderCommand'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');return <EnterpriseOrderCommand initial={await adminOrderCommand(context)}/>}
