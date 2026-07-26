import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { enqueueCompilation } from '@/lib/market-os/marketing-ai/phase3-repository'
export async function POST(_request:Request,context:{params:Promise<{id:string}>}){try{const actor=await requireMarketingAiUser('run');const {id}=await context.params;const jobs=await enqueueCompilation(id,actor.id);return Response.json({ok:true,jobs})}catch(error){return apiErrorResponse(error)}}
