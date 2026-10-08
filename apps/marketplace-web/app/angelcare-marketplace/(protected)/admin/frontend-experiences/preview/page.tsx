import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {listFrontendSurfaces} from '@/angelcare-marketplace/total-commerce-control/repository'
import {SurfaceRegistryStudio} from '@/angelcare-marketplace/total-commerce-control/components/SurfaceRegistryStudio'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.commerce.view');return <SurfaceRegistryStudio surfaces={await listFrontendSurfaces()}/>}
