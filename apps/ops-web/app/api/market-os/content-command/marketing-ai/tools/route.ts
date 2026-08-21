import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { marketingToolRegistry } from '@/lib/market-os/marketing-ai/tool-gateway'
async function GET__angelcareGovernedImpl(){try{await requireMarketingAiUser('view');return Response.json({ok:true,tools:marketingToolRegistry(),externalActionsAllowed:false})}catch(error){return apiErrorResponse(error)}}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/tools',
  },
  GET__angelcareGovernedImpl,
)
