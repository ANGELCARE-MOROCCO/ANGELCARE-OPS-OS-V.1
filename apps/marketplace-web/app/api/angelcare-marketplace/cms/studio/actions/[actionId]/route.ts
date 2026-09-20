import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { getStudioAction } from '@/angelcare-marketplace/studio-action-registry/resolver'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{actionId:string}>}){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');const{actionId}=await params;const action=getStudioAction(decodeURIComponent(actionId));if(!action)throw new MarketplaceError('NOT_FOUND','Action Studio inconnue.');return apiSuccess(action,{requestId:id})}catch(error){return apiFailure(error,id)}}
