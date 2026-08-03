import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {ReturnsCommand} from '@/angelcare-marketplace/operations-reconciliation/components/CaseCommands'
import {listReplacements,listReturns} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');const[a,b]=await Promise.all([listReturns(c),listReplacements(c)]);return <ReturnsCommand returns={a} replacements={b}/>}
