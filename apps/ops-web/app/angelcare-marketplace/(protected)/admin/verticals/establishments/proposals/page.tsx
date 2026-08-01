import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PortfolioRegistry } from '@/angelcare-marketplace/b2b-verticals/components/PortfolioRegistry'
import { verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.establishments.manage');const data=await verticalPortfolio({context,vertical:'establishment'});return <PortfolioRegistry title="Propositions institutionnelles" subtitle="Diagnostic, recommandation, programme et conversion commerciale." {...data}/>}
