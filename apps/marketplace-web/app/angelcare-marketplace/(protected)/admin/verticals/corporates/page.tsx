import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CorporateCommand } from '@/angelcare-marketplace/b2b-verticals/components/CorporateCommand'
import { listCorporateEligibility,listCorporatePrograms,verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.corporates.view');const [portfolio,programs,eligibility]=await Promise.all([verticalPortfolio({context,vertical:'corporate'}),listCorporatePrograms(context),listCorporateEligibility(context)]);return <CorporateCommand portfolio={portfolio} programs={programs} rules={eligibility.rules} quotas={eligibility.quotas}/>}
