import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId, requireText } from '@/angelcare-marketplace/server/request'
import { captureExternalExperience } from '@/angelcare-marketplace/studio-universal/capture'

export async function POST(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.blocks.manage');const body=await parseJsonObject(request);return apiSuccess(await captureExternalExperience(requireText(body.url,'url','URL source',2048)),{requestId:id})}catch(error){return apiFailure(error,id)}}
