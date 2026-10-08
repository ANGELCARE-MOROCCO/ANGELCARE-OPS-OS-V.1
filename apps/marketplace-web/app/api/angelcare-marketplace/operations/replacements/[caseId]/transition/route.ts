import {handleReplacementTransition} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
type Context={params:Promise<{caseId:string}>}
export async function POST(request:Request,context:Context){const{caseId}=await context.params;return handleReplacementTransition(request,caseId)}
