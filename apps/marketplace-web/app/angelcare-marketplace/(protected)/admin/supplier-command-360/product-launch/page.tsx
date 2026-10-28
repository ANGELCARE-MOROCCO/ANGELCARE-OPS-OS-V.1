import {requireMarketplaceWorkspacePageContext} from '@/angelcare-marketplace/auth/context'
import {SupplierProductLaunch} from '@/angelcare-marketplace/supplier-command-360/SupplierProductLaunch'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplaceWorkspacePageContext('workspace.supplier_command');return <SupplierProductLaunch/>}
