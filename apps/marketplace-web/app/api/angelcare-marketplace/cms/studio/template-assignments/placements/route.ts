import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { listStudioTemplatePlacements } from '@/angelcare-marketplace/studio-template-assignment/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.homepage.view');const locale=new URL(request.url).searchParams.get('locale')||undefined;return apiSuccess({placements:await listStudioTemplatePlacements(locale)},{requestId:id})}catch(error){return apiFailure(error,id)}}
