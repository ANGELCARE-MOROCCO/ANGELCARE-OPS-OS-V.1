import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { getStudioSourceEntity } from '@/angelcare-marketplace/studio-source-registry/resolver'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{sourceId:string;entityId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.view');const{sourceId,entityId}=await params;const entity=await getStudioSourceEntity(decodeURIComponent(sourceId),decodeURIComponent(entityId),{context:{locale:context.locale,territoryId:context.territoryId}},context);if(!entity)throw new MarketplaceError('NOT_FOUND','Entité Studio introuvable.');return apiSuccess(entity,{requestId:id})}catch(error){return apiFailure(error,id)}}
