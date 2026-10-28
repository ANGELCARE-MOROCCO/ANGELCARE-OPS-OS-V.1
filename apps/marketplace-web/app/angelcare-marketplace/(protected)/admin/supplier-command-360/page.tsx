import { requireMarketplaceWorkspacePageContext } from '@/angelcare-marketplace/auth/context'
import { SupplierCommand360 } from '@/angelcare-marketplace/supplier-command-360/SupplierCommand360'
export const dynamic = 'force-dynamic'
export default async function Page(){
 await requireMarketplaceWorkspacePageContext('workspace.supplier_command')
 return <SupplierCommand360/>
}
