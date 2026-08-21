import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listDeadLetters, listJobs } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl(){try{await requireMarketingAiUser('view');const [deadLetters,jobs]=await Promise.all([listDeadLetters(),listJobs(250)]);return Response.json({ok:true,deadLetters,staleJobs:jobs.filter((job: import('@/lib/market-os/marketing-ai/phase3-types').Phase3ExecutionJob)=>['claimed','running'].includes(job.status)&&job.heartbeatAt&&Date.now()-new Date(job.heartbeatAt).getTime()>15*60*1000)})}catch(error){return apiErrorResponse(error)}}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/recovery',
  },
  GET__angelcareGovernedImpl,
)
