import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listDecisions } from '@/lib/market-os/marketing-ai/phase3-repository'
export async function GET(){try{await requireMarketingAiUser('view');return Response.json({ok:true,decisions:await listDecisions()})}catch(error){return apiErrorResponse(error)}}
