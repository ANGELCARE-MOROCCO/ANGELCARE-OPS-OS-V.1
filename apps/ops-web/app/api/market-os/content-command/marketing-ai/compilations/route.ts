import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { compileMarketingMission } from '@/lib/market-os/marketing-ai/compiler'
import { compilationCreateSchema } from '@/lib/market-os/marketing-ai/phase3-schemas'
import { listCompilations } from '@/lib/market-os/marketing-ai/phase3-repository'
async function GET__angelcareGovernedImpl(){ try{ await requireMarketingAiUser('view'); return Response.json({ok:true,compilations:await listCompilations()}) }catch(error){return apiErrorResponse(error)} }
async function POST__angelcareGovernedImpl(request:Request){ try{ const actor=await requireMarketingAiUser('manage'); const body=compilationCreateSchema.parse(await request.json()); const compiled=await compileMarketingMission({...body,actor}); return Response.json({ok:true,...compiled},{status:201}) }catch(error){return apiErrorResponse(error)} }

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/compilations',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/compilations',
  },
  POST__angelcareGovernedImpl,
)
