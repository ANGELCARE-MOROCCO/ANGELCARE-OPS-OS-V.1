import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listJobs } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl(request:Request){try{await requireMarketingAiUser('view');const limit=Math.min(300,Math.max(1,Number(new URL(request.url).searchParams.get('limit')||150)));return Response.json({ok:true,jobs:await listJobs(limit)})}catch(error){return apiErrorResponse(error)}}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/queue',
  },
  GET__angelcareGovernedImpl,
)
