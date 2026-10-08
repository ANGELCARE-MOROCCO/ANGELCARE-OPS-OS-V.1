import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { STUDIO_DYNAMIC_EMPTY_POLICIES, STUDIO_DYNAMIC_STRATEGIES } from '@/angelcare-marketplace/studio-dynamic-source/types'
import { STUDIO_DYNAMIC_SOURCE_PROFILES } from '@/angelcare-marketplace/studio-dynamic-source/registry'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess({sources:STUDIO_DYNAMIC_SOURCE_PROFILES,strategies:STUDIO_DYNAMIC_STRATEGIES,emptyPolicies:STUDIO_DYNAMIC_EMPTY_POLICIES},{requestId:id})}catch(error){return apiFailure(error,id)}}
