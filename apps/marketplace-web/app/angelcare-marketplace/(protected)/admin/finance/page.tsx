import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { financeSummary,listRevenueStreams } from '@/angelcare-marketplace/finance-authority/repository'
import { FinanceCommand } from '@/angelcare-marketplace/finance-authority/components/FinanceCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');const [summary,streams]=await Promise.all([financeSummary(context),listRevenueStreams(context)]);return <FinanceCommand summary={summary} streams={streams}/>}