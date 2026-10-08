import {handleRecoveryTransition} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
type Context={params:Promise<{planId:string}>}
export async function POST(request:Request,context:Context){const{planId}=await context.params;return handleRecoveryTransition(request,planId)}
