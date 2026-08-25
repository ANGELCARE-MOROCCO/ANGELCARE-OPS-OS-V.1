import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {assistedOrderOptions,listSearchRules} from '@/angelcare-marketplace/total-commerce-control/repository'
import {DiscoveryControl} from '@/angelcare-marketplace/total-commerce-control/components/DiscoveryControl'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.merchandising.view');const[rules,options]=await Promise.all([listSearchRules(),assistedOrderOptions()]);return <DiscoveryControl initial={rules} options={options}/>}
