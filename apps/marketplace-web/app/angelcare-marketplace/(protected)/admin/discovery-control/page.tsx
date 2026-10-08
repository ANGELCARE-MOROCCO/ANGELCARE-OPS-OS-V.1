import {hasMarketplacePermission,requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {assistedOrderOptions,listSearchRules} from '@/angelcare-marketplace/total-commerce-control/repository'
import {DiscoveryControl} from '@/angelcare-marketplace/total-commerce-control/components/DiscoveryControl'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.merchandising.view');const[rules,options]=await Promise.all([listSearchRules(),assistedOrderOptions()]);return <DiscoveryControl initial={rules} options={options} canManage={hasMarketplacePermission(context,'marketplace.merchandising.manage')}/>}
