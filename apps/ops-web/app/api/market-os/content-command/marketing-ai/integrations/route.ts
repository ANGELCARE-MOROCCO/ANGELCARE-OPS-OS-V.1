import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { assembleMarketingAutopilotContext } from '@/lib/market-os/marketing-ai/context-assembler'
import { listConflicts, listSyncLinks } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl(){try{await requireMarketingAiUser('view');const context=await assembleMarketingAutopilotContext();const [links,conflicts]=await Promise.all([listSyncLinks(),listConflicts()]);return Response.json({ok:true,context,links,conflicts})}catch(error){return apiErrorResponse(error)}}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/integrations',
  },
  GET__angelcareGovernedImpl,
)
