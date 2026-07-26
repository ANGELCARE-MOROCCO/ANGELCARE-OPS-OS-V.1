import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { controlMarketingJob } from '@/lib/market-os/marketing-ai/queue-engine'
import { queueControlSchema } from '@/lib/market-os/marketing-ai/phase3-schemas'
import { getJob } from '@/lib/market-os/marketing-ai/phase3-repository'
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{await requireMarketingAiUser('run');const {id}=await context.params;const body=queueControlSchema.parse(await request.json());const job=await getJob(id);if(!job)throw new Error('JOB_NOT_FOUND');return Response.json({ok:true,job:await controlMarketingJob(job,body.action,body.reason)})}catch(error){return apiErrorResponse(error)}}
