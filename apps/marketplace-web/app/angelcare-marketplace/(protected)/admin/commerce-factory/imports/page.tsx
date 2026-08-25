import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {IndustrialImportWorkspace} from '@/angelcare-marketplace/commerce-product-atelier/components/IndustrialImportWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <IndustrialImportWorkspace/>}
