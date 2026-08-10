import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { walletAuthoritySnapshot } from '@/angelcare-marketplace/customer-commerce/wallet-admin'
import { WalletAuthorityClient } from '@/angelcare-marketplace/customer-commerce/components/WalletAuthorityClient'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');return <WalletAuthorityClient mode="customers" snapshot={await walletAuthoritySnapshot(context)}/>}
