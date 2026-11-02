import { requireMarketplaceWorkspacePageContext } from '@/angelcare-marketplace/auth/context'
import { OperationsMax } from '@/angelcare-marketplace/supplier-ops-max/OperationsMax'
export const dynamic='force-dynamic'
export default async function Page(){
 await requireMarketplaceWorkspacePageContext('workspace.supplier_command')
 return <OperationsMax/>
}
