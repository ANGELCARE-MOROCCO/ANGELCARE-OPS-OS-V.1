import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {ExceptionCockpit} from '@/angelcare-marketplace/operations-reconciliation/components/CaseCommands'
import {listOperationalExceptions} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <ExceptionCockpit items={await listOperationalExceptions(c)}/>}
