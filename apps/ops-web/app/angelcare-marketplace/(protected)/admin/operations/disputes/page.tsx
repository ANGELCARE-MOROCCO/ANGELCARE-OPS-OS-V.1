import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {DisputeCommand} from '@/angelcare-marketplace/operations-reconciliation/components/CaseCommands'
import {listDisputes} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <DisputeCommand items={await listDisputes(c)}/>}
