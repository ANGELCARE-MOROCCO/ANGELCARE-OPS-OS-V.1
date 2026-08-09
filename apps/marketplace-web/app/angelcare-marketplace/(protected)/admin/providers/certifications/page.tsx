import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { DocumentsBoard } from '@/angelcare-marketplace/provider-workforce/components/DocumentsBoard'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.providers.view');void context;return <DocumentsBoard/>}
