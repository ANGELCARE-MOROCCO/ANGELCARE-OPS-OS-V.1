import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { enqueueCompilation } from '@/lib/market-os/marketing-ai/phase3-repository'
async function POST__angelcareGovernedImpl(_request:Request,context:{params:Promise<{id:string}>}){try{const actor=await requireMarketingAiUser('run');const {id}=await context.params;const jobs=await enqueueCompilation(id,actor.id);return Response.json({ok:true,jobs})}catch(error){return apiErrorResponse(error)}}

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/compilations/[id]/execute',
  },
  POST__angelcareGovernedImpl,
)
