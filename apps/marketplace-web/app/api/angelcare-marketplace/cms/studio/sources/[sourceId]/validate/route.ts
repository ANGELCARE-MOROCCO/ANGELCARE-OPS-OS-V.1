import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '@/angelcare-marketplace/server/request'
import { getAuthorizedStudioSource,validateStudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/resolver'
import { validateCanonicalCatalogStudioEntity } from '@/angelcare-marketplace/studio-universal/catalog-source-gateway'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request:Request,{params}:{params:Promise<{sourceId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.view');const{sourceId}=await params;const body=await parseJsonObject(request);const entityId=String(body.entityId||'').trim();const decoded=decodeURIComponent(sourceId);getAuthorizedStudioSource(decoded,context);return apiSuccess(decoded==='catalog.items'?await validateCanonicalCatalogStudioEntity(entityId,{context:{locale:context.locale,territoryId:context.territoryId}},context):await validateStudioSourceReference({sourceId:decoded,entityId},{context:{locale:context.locale,territoryId:context.territoryId}},context),{requestId:id})}catch(error){return apiFailure(error,id)}}
