import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { ANGELCARE_STUDIO_DEVELOPER_CONTRACT } from '@/angelcare-marketplace/studio-universal/developer-contract'

export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess(ANGELCARE_STUDIO_DEVELOPER_CONTRACT,{requestId:id})}catch(error){return apiFailure(error,id)}}
