import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {SettlementCommand} from '@/angelcare-marketplace/operations-reconciliation/components/CaseCommands'
import {listSettlements} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.finance.view');return <SettlementCommand items={await listSettlements(c)}/>}
