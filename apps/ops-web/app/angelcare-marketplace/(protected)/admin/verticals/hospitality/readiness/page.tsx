import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { VerticalOperationsBoard } from '@/angelcare-marketplace/b2b-verticals/components/VerticalOperationsBoard'
import { verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.hospitality.view');const portfolio=await verticalPortfolio({context,vertical:'hospitality'});return <VerticalOperationsBoard portfolio={portfolio} title="Readiness Hospitality" subtitle="Sécurité, staffing, espaces, matériel, consentement et lancement."/>}
