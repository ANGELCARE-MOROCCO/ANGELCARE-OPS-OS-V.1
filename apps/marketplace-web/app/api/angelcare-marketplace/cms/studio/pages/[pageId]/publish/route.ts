import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, cleanOptionalText, parseJsonObject, requestId } from '@/angelcare-marketplace/server/request'
import { publishStudioPage } from '@/angelcare-marketplace/studio-universal/repository'

export async function POST(request:Request,{params}:{params:Promise<{pageId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.publish');const body:Record<string,unknown>=await parseJsonObject(request).catch(()=>({} as Record<string,unknown>));const {pageId}=await params;return apiSuccess(await publishStudioPage({pageId,context,requestId:id,reason:cleanOptionalText(body.reason,1000)||'Publication depuis AngelCare Marketplace Studio'}),{requestId:id})}catch(error){return apiFailure(error,id)}}
