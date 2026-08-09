import {handleFulfillmentDossier} from '@/angelcare-marketplace/operations-reconciliation/api-handlers'
export async function GET(r:Request,{params}:{params:Promise<{caseId:string}>}){const{caseId}=await params;return handleFulfillmentDossier(r,caseId)}
