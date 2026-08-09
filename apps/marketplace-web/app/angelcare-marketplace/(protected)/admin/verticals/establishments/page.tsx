import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { EstablishmentsCommand } from '@/angelcare-marketplace/b2b-verticals/components/EstablishmentsCommand'
import { listEstablishmentQualityChecks,verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.establishments.view');const [portfolio,qualityChecks]=await Promise.all([verticalPortfolio({context,vertical:'establishment'}),listEstablishmentQualityChecks(context)]);return <EstablishmentsCommand portfolio={portfolio} qualityChecks={qualityChecks}/>}
