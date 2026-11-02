import {requireMarketplaceWorkspacePageContext} from '@/angelcare-marketplace/auth/context'
import {SupplierOpsMax} from '@/angelcare-marketplace/supplier-ops-max/SupplierOpsMax'
export const dynamic='force-dynamic'
export default async function Page(){
 await requireMarketplaceWorkspacePageContext('workspace.supplier_command')
 return <SupplierOpsMax/>
}
