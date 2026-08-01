import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { VerticalOperationsBoard } from '@/angelcare-marketplace/b2b-verticals/components/VerticalOperationsBoard'
import { verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.corporates.view');const portfolio=await verticalPortfolio({context,vertical:'corporate'});return <VerticalOperationsBoard portfolio={portfolio} title="Usage des avantages" subtitle="Consommation, réservations, exceptions et soldes."/>}
