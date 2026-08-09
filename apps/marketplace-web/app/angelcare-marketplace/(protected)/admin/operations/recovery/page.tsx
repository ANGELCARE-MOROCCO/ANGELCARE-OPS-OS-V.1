import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {RecoveryCommand} from '@/angelcare-marketplace/operations-reconciliation/components/CaseCommands'
import {listRecoveries} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <RecoveryCommand items={await listRecoveries(c)}/>}
