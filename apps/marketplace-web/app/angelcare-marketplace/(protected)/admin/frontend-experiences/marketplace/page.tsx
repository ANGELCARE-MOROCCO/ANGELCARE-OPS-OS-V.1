import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {getFrontendSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {SURFACE_BY_KEY} from '@/angelcare-marketplace/total-commerce-control/surface-registry'
import {SurfaceExperienceStudio} from '@/angelcare-marketplace/total-commerce-control/components/SurfaceExperienceStudio'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.publication.manage');const definition=SURFACE_BY_KEY.get('marketplace-index')!;const initial=await getFrontendSurface('marketplace-index');return initial?<SurfaceExperienceStudio definition={definition} initial={initial}/>:null}
