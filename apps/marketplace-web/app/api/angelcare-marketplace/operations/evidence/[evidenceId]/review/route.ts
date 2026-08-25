import {handleFulfillmentEvidenceReview} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
type Context={params:Promise<{evidenceId:string}>}
export async function POST(request:Request,context:Context){const{evidenceId}=await context.params;return handleFulfillmentEvidenceReview(request,evidenceId)}
