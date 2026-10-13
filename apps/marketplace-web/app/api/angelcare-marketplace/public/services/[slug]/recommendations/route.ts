import {readServiceRecommendations} from '@/angelcare-marketplace/service-commerce-experience/recommendation-repository'
import {apiFailure,apiSuccess,requestId} from '@/angelcare-marketplace/server/request'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
 const id=requestId(request)
 try{const {slug}=await params;if(!slug||slug.length>180)throw new MarketplaceError('VALIDATION_ERROR','Référence de service invalide.');const value=new URL(request.url).searchParams.get('locale'),locale=value==='ar'?'ar':value==='en'?'en':'fr';return apiSuccess(await readServiceRecommendations({slug,locale}),{requestId:id})}catch(error){return apiFailure(error,id)}
}
