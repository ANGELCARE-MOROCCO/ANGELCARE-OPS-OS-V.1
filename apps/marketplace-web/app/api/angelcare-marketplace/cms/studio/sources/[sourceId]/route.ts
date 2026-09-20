import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { getAuthorizedStudioSource } from '@/angelcare-marketplace/studio-source-registry/resolver'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{sourceId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.view');const{sourceId}=await params;return apiSuccess(getAuthorizedStudioSource(decodeURIComponent(sourceId),context),{requestId:id})}catch(error){return apiFailure(error,id)}}
