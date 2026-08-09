import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { DiagnosticRegistry } from '@/angelcare-marketplace/b2b-verticals/components/PortfolioRegistry'
import { verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.conversions.manage');const data=await verticalPortfolio({context,vertical:'establishment'});return <DiagnosticRegistry diagnostics={data.diagnostics.filter(item=>['qualified','converted'].includes(item.status))} organizations={data.organizations}/>}
