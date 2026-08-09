import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ImportExportStudio } from '@/angelcare-marketplace/commerce-studio/components/ImportExportStudio'
export default async function Page(){await requireMarketplacePageContext('marketplace.commerce.import');return <ImportExportStudio/>}
