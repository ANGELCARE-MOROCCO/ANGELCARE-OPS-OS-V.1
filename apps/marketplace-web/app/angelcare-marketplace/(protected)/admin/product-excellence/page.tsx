import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {productExcellenceSnapshot} from '@/angelcare-marketplace/total-commerce-control/repository'
import {ProductExcellenceCommand} from '@/angelcare-marketplace/total-commerce-control/components/ProductExcellenceCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.commerce.view');return <ProductExcellenceCommand data={await productExcellenceSnapshot()}/>}
