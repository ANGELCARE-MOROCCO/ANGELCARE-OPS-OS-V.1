import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CorporateEligibilityCommand } from '@/angelcare-marketplace/b2b-verticals/components/CorporateEligibilityCommand'
import { listCorporateEligibility } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.corporates.eligibility_manage');const data=await listCorporateEligibility(context);return <CorporateEligibilityCommand rules={data.rules} quotas={data.quotas}/>}
