import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ChildProfileForm } from '@/angelcare-marketplace/family-experience/components/ChildProfileForm'
export default async function Page(){await requireMarketplacePageContext('marketplace.family.children.manage');return <ChildProfileForm/>}
