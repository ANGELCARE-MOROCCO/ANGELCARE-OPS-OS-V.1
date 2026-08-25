import {handleReconciliationLineDecision} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
type Context={params:Promise<{lineId:string}>}
export async function POST(request:Request,context:Context){const{lineId}=await context.params;return handleReconciliationLineDecision(request,lineId)}
