import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { listStudioTemplateFamilies } from '@/angelcare-marketplace/studio-template-assignment/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess({families:await listStudioTemplateFamilies()},{requestId:id})}catch(error){return apiFailure(error,id)}}
