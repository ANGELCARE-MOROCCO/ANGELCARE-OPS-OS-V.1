import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { DiagnosticRegistry } from '@/angelcare-marketplace/b2b-verticals/components/PortfolioRegistry'
import { verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.diagnostics.view');const data=await verticalPortfolio({context,vertical:'establishment'});return <DiagnosticRegistry diagnostics={data.diagnostics} organizations={data.organizations}/>}
