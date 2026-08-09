import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminWalletPolicies } from '@/angelcare-marketplace/customer-commerce/admin-repository'
import { WalletPolicyStudio } from '@/angelcare-marketplace/customer-commerce/components/WalletPolicyStudio'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.finance.price_books.manage');return <WalletPolicyStudio initialPolicies={await adminWalletPolicies()}/>}
