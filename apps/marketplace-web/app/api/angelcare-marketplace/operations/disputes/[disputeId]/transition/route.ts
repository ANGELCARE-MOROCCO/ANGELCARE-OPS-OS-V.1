import {handleDisputeTransition} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
type Context={params:Promise<{disputeId:string}>}
export async function POST(request:Request,context:Context){const{disputeId}=await context.params;return handleDisputeTransition(request,disputeId)}
