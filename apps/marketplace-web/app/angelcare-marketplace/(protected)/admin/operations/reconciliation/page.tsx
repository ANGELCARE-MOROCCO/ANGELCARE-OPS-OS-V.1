import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {ReconciliationCommand} from '@/angelcare-marketplace/operations-reconciliation/components/CaseCommands'
import {listReconciliations} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.finance.view');return <ReconciliationCommand items={await listReconciliations(c)}/>}
