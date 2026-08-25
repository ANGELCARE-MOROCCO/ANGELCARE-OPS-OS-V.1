import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { DocumentFactoryCommand } from '@/angelcare-marketplace/enterprise-command/components/DocumentFactoryCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <DocumentFactoryCommand/>}
