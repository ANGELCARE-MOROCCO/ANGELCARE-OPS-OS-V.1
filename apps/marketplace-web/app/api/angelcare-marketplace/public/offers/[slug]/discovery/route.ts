import {readOfferDiscovery} from '@/angelcare-marketplace/offer-discovery/repository'
import {apiFailure,apiSuccess,requestId} from '@/angelcare-marketplace/server/request'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){const id=requestId(request);try{const {slug}=await params;if(!slug||slug.length>180)throw new MarketplaceError('VALIDATION_ERROR','Référence invalide.');const language=new URL(request.url).searchParams.get('locale'),locale=language==='ar'?'ar':language==='en'?'en':'fr';return apiSuccess(await readOfferDiscovery({slug,locale}),{requestId:id})}catch(error){return apiFailure(error,id)}}
