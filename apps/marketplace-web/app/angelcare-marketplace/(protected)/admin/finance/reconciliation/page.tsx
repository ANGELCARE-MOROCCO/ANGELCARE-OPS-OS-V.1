import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listReconciliation } from '@/angelcare-marketplace/finance-authority/repository'
import { ReconciliationAuthority } from '@/angelcare-marketplace/finance-authority/components/FinanceRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');return <ReconciliationAuthority items={await listReconciliation(context)} canResolve={hasMarketplacePermission(context,'marketplace.finance.reconciliation.manage')}/>}
