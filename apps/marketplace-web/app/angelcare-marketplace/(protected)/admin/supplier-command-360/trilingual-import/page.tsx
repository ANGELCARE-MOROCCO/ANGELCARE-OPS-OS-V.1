import { requireMarketplaceWorkspacePageContext } from '@/angelcare-marketplace/auth/context'
import { SupplierTrilingualImport } from '@/angelcare-marketplace/supplier-command-360/SupplierTrilingualImport'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplaceWorkspacePageContext('workspace.supplier_command');return <SupplierTrilingualImport/>}
