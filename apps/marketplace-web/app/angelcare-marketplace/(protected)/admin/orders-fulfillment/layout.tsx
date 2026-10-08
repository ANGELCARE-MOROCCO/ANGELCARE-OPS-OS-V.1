import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { TransactionAreaShell } from '@/angelcare-marketplace/transaction-flight-deck/components/TransactionAreaShell'
export const dynamic='force-dynamic'
export default async function Layout({children}:{children:React.ReactNode}){await requireMarketplacePageContext('marketplace.operations.view');return <TransactionAreaShell>{children}</TransactionAreaShell>}
