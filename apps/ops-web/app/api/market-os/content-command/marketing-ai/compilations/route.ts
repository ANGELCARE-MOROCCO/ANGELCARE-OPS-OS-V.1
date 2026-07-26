import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { compileMarketingMission } from '@/lib/market-os/marketing-ai/compiler'
import { compilationCreateSchema } from '@/lib/market-os/marketing-ai/phase3-schemas'
import { listCompilations } from '@/lib/market-os/marketing-ai/phase3-repository'
export async function GET(){ try{ await requireMarketingAiUser('view'); return Response.json({ok:true,compilations:await listCompilations()}) }catch(error){return apiErrorResponse(error)} }
export async function POST(request:Request){ try{ const actor=await requireMarketingAiUser('manage'); const body=compilationCreateSchema.parse(await request.json()); const compiled=await compileMarketingMission({...body,actor}); return Response.json({ok:true,...compiled},{status:201}) }catch(error){return apiErrorResponse(error)} }
