import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { HealthPartnersCommand } from '@/angelcare-marketplace/b2b-verticals/components/HealthPartnersCommand'
import { listHealthBoundaries,verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.health_partners.view');const [portfolio,compliance]=await Promise.all([verticalPortfolio({context,vertical:'health_partner'}),listHealthBoundaries(context)]);return <HealthPartnersCommand portfolio={portfolio} boundaries={compliance.boundaries} consents={compliance.consents}/>}
