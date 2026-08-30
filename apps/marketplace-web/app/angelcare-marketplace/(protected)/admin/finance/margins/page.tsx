import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listMarginExceptions } from '@/angelcare-marketplace/finance-authority/repository'
import { MarginAuthority } from '@/angelcare-marketplace/finance-authority/components/FinanceRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.margins.view');return <MarginAuthority items={await listMarginExceptions(context)} canDecide={hasMarketplacePermission(context,'marketplace.finance.exceptions.approve')}/>}
