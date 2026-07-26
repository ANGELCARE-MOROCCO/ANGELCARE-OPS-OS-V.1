import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { assembleMarketingAutopilotContext } from '@/lib/market-os/marketing-ai/context-assembler'
import { listConflicts, listSyncLinks } from '@/lib/market-os/marketing-ai/phase3-repository'
export async function GET(){try{await requireMarketingAiUser('view');const context=await assembleMarketingAutopilotContext();const [links,conflicts]=await Promise.all([listSyncLinks(),listConflicts()]);return Response.json({ok:true,context,links,conflicts})}catch(error){return apiErrorResponse(error)}}
