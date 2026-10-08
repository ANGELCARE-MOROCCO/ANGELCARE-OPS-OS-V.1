import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {apiFailure,apiSuccess,requestId} from '@/angelcare-marketplace/server/request'
import {listMediaUsageReferences} from '@/angelcare-marketplace/total-commerce-control/repository'
export async function GET(request:Request,{params}:{params:Promise<{mediaId:string}>}){const rid=requestId(request);try{await requireMarketplaceApiContext('marketplace.commerce.view');const{mediaId}=await params;return apiSuccess(await listMediaUsageReferences(mediaId),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
