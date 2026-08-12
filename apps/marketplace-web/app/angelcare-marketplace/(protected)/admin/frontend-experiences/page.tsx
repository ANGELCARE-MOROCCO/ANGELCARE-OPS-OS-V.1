import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {frontendControlSnapshot} from '@/angelcare-marketplace/total-commerce-control/repository'
import {FrontendControlCommand} from '@/angelcare-marketplace/total-commerce-control/components/FrontendControlCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.commerce.view');return <FrontendControlCommand snapshot={await frontendControlSnapshot()}/>}
