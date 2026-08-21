import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { controlMarketingJob } from '@/lib/market-os/marketing-ai/queue-engine'
import { queueControlSchema } from '@/lib/market-os/marketing-ai/phase3-schemas'
import { getJob } from '@/lib/market-os/marketing-ai/phase3-repository'
async function POST__angelcareGovernedImpl(request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    const body=queueControlSchema.parse(await request.json())
    await requireMarketingAiUser(['cancel','dead_letter','replay'].includes(body.action)?'govern':'run')
    const job=await getJob(id);if(!job)throw new Error('JOB_NOT_FOUND')
    return Response.json({ok:true,job:await controlMarketingJob(job,body.action,body.reason)})
  }catch(error){return apiErrorResponse(error)}
}

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/queue/[id]/control',
  },
  POST__angelcareGovernedImpl,
)
