import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { B2BExecutiveCommand } from '@/angelcare-marketplace/b2b-verticals/components/B2BExecutiveCommand'
import { b2bSummary,listOrganizations } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.view');const [summary,organizations]=await Promise.all([b2bSummary(context),listOrganizations({context})]);return <B2BExecutiveCommand summary={summary} organizations={organizations}/>}
