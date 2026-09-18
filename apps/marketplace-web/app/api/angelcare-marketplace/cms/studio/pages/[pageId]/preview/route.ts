import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { createStudioPreview } from '@/angelcare-marketplace/studio-universal/repository'

export async function POST(request:Request,{params}:{params:Promise<{pageId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.preview');const {pageId}=await params;const preview=await createStudioPreview({pageId,context,requestId:id});return apiSuccess({preview,url:`/angelcare-marketplace/preview/${preview.preview_token}`},{requestId:id,status:201})}catch(error){return apiFailure(error,id)}}
