import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listBridgeVersions } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl(){try{await requireMarketingAiUser('view');return Response.json({ok:true,versions:await listBridgeVersions()})}catch(error){return apiErrorResponse(error)}}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/bridge/versions',
  },
  GET__angelcareGovernedImpl,
)
