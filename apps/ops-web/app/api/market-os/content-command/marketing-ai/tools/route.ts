import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { marketingToolRegistry } from '@/lib/market-os/marketing-ai/tool-gateway'
export async function GET(){try{await requireMarketingAiUser('view');return Response.json({ok:true,tools:marketingToolRegistry(),externalActionsAllowed:false})}catch(error){return apiErrorResponse(error)}}
