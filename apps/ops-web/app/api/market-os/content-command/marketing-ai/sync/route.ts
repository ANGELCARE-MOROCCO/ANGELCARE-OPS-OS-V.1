import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { syncRequestSchema } from '@/lib/market-os/marketing-ai/phase3-schemas'
import { createSyncLink } from '@/lib/market-os/marketing-ai/phase3-repository'
async function POST__angelcareGovernedImpl(request:Request){try{const actor=await requireMarketingAiUser('manage');const body=syncRequestSchema.parse(await request.json());if(!body.targetId)throw new Error('TARGET_ID_REQUIRED');const link=await createSyncLink({...body,targetId:body.targetId,actorId:actor.id});return Response.json({ok:true,link},{status:201})}catch(error){return apiErrorResponse(error)}}

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/sync',
  },
  POST__angelcareGovernedImpl,
)
