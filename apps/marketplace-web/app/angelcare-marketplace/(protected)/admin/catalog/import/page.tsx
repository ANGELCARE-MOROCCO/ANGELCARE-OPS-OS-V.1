import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProductImportStudio } from '@/angelcare-marketplace/enterprise-command/components/ProductImportStudio'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <ProductImportStudio/>}
