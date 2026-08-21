import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listDecisions } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl(){try{await requireMarketingAiUser('view');return Response.json({ok:true,decisions:await listDecisions()})}catch(error){return apiErrorResponse(error)}}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/decisions',
  },
  GET__angelcareGovernedImpl,
)
