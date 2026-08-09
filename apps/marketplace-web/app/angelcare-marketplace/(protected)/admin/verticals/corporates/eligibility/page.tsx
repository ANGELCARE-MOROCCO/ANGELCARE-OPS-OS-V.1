import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CorporateEligibilityBoard } from '@/angelcare-marketplace/b2b-verticals/components/SpecializedBoards'
import { listCorporateEligibility } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.corporates.eligibility_manage');const data=await listCorporateEligibility(context);return <CorporateEligibilityBoard rules={data.rules} quotas={data.quotas}/>}
