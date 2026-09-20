import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {buildPublicExperienceResolutionTrace} from '@/angelcare-marketplace/public-experience-authority/resolution-trace'
import {buildPublicExperienceStateMatrix} from '@/angelcare-marketplace/public-experience-authority/state-matrix'
import {apiFailure,apiSuccess,requestId} from '@/angelcare-marketplace/server/request'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{itemSlug:string}>}){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.admin.access');const{itemSlug}=await params;const url=new URL(request.url),locale=(['fr','en','ar'].includes(url.searchParams.get('locale')||'')?url.searchParams.get('locale'):'fr') as 'fr'|'en'|'ar';const trace=await buildPublicExperienceResolutionTrace({slug:itemSlug,locale,collectionId:url.searchParams.get('collectionId'),placementId:url.searchParams.get('placementId')});if(!trace)throw new MarketplaceError('NOT_FOUND','Offre publique introuvable.');return apiSuccess({trace,stateMatrix:buildPublicExperienceStateMatrix(trace.experience360)},{requestId:id})}catch(error){return apiFailure(error,id)}}
