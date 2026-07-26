import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listBridgeVersions } from '@/lib/market-os/marketing-ai/phase3-repository'
export async function GET(){try{await requireMarketingAiUser('view');return Response.json({ok:true,versions:await listBridgeVersions()})}catch(error){return apiErrorResponse(error)}}
