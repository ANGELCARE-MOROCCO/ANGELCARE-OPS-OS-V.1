import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { EnterpriseCommandHub } from '@/angelcare-marketplace/enterprise-command/components/EnterpriseCommandHub'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <EnterpriseCommandHub/>}
