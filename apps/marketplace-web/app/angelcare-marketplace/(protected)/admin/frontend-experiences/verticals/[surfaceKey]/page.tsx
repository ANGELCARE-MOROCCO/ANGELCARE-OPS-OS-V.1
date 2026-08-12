import {notFound} from 'next/navigation'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {getFrontendSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {SURFACE_BY_KEY} from '@/angelcare-marketplace/total-commerce-control/surface-registry'
import {SurfaceExperienceStudio} from '@/angelcare-marketplace/total-commerce-control/components/SurfaceExperienceStudio'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{surfaceKey:string}>}){await requireMarketplacePageContext('marketplace.commerce.view');const{surfaceKey}=await params;const definition=SURFACE_BY_KEY.get(surfaceKey);if(!definition||definition.type!=='vertical')notFound();const initial=await getFrontendSurface(surfaceKey);if(!initial)notFound();return <SurfaceExperienceStudio definition={definition} initial={initial}/>}
