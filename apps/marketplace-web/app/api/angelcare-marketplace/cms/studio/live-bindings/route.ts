import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { STUDIO_BINDING_TARGETS, STUDIO_LIVE_BINDINGS } from '@/angelcare-marketplace/studio-live-binding/registry'
import { STUDIO_BINDING_MISSING_POLICIES } from '@/angelcare-marketplace/studio-live-binding/types'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess({bindings:STUDIO_LIVE_BINDINGS,targets:STUDIO_BINDING_TARGETS,missingPolicies:STUDIO_BINDING_MISSING_POLICIES},{requestId:id})}catch(error){return apiFailure(error,id)}}
