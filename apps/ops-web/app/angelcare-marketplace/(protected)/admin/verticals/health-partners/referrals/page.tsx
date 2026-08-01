import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { VerticalOperationsBoard } from '@/angelcare-marketplace/b2b-verticals/components/VerticalOperationsBoard'
import { verticalPortfolio } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.health_partners.view');const portfolio=await verticalPortfolio({context,vertical:'health_partner'});return <VerticalOperationsBoard portfolio={portfolio} title="Protocoles de referral" subtitle="Contacts licenciés, règles d’escalade et traçabilité."/>}
