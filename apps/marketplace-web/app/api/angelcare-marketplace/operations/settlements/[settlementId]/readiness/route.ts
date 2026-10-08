import {handleSettlementReadinessUpdate} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
type Context={params:Promise<{settlementId:string}>}
export async function POST(request:Request,context:Context){const{settlementId}=await context.params;return handleSettlementReadinessUpdate(request,settlementId)}
