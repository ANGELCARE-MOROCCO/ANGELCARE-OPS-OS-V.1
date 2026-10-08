import{requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{BulkOperationsCenter}from '@/angelcare-marketplace/enterprise-command/components/BulkOperationsCenter'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <BulkOperationsCenter/>}
