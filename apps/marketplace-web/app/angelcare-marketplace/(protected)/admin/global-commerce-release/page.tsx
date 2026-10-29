import {requireMarketplaceAdminPageContext} from '@/angelcare-marketplace/auth/context'
import {GlobalCommerceReleaseClient} from '@/angelcare-marketplace/global-commerce-release/GlobalCommerceReleaseClient'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplaceAdminPageContext('marketplace.admin.access');return <GlobalCommerceReleaseClient/>}
