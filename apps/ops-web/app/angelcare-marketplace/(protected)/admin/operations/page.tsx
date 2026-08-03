import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsCommerceCommand} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsCommerceCommand'
import {operationsCommerceSummary} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsCommerceCommand data={await operationsCommerceSummary(c)}/>}
