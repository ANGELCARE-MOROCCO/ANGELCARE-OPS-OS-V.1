import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { studioReleaseReadiness } from '@/angelcare-marketplace/studio-universal/release-readiness'

export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess(studioReleaseReadiness(),{requestId:id})}catch(error){return apiFailure(error,id)}}
