import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { getCompilation } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl(_request:Request,context:{params:Promise<{id:string}>}){ try{await requireMarketingAiUser('view');const {id}=await context.params;const value=await getCompilation(id);if(!value)throw new Error('COMPILATION_NOT_FOUND');return Response.json({ok:true,...value})}catch(error){return apiErrorResponse(error)} }

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/compilations/[id]',
  },
  GET__angelcareGovernedImpl,
)
