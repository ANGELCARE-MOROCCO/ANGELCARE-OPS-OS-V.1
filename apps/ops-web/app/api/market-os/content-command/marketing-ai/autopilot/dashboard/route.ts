import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { assembleMarketingAutopilotContext } from '@/lib/market-os/marketing-ai/context-assembler'
import { getPhase3Dashboard } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl() { try { await requireMarketingAiUser('view'); const context=await assembleMarketingAutopilotContext(); return Response.json({ok:true,snapshot:await getPhase3Dashboard(context.sources)}) } catch(error){ return apiErrorResponse(error) } }

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/autopilot/dashboard',
  },
  GET__angelcareGovernedImpl,
)
