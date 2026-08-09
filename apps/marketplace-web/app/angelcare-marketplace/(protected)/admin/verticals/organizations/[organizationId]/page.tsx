import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { Organization360 } from '@/angelcare-marketplace/b2b-verticals/components/Organization360'
import { getOrganization360 } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page({params}:{params:Promise<{organizationId:string}>}){const context=await requireMarketplacePageContext('marketplace.b2b.view');const {organizationId}=await params;return <Organization360 data={await getOrganization360({organizationId,context})}/>}
