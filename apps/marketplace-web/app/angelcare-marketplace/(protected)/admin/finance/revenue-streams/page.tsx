import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listRevenueStreams } from '@/angelcare-marketplace/finance-authority/repository'
import { RevenueAuthority } from '@/angelcare-marketplace/finance-authority/components/FinanceRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.revenue.view');return <RevenueAuthority items={await listRevenueStreams(context)}/>}