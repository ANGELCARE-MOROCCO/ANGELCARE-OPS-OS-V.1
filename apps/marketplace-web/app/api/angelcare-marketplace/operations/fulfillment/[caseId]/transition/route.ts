import {handleFulfillmentTransition} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{caseId:string}>}){const{caseId}=await params;return handleFulfillmentTransition(r,caseId)}
