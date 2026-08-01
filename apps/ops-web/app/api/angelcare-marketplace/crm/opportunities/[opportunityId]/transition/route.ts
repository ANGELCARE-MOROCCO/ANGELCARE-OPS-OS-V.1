import { handleOpportunityTransition } from '@/angelcare-marketplace/commercial-pipeline/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{opportunityId:string}>}){return handleOpportunityTransition(request,(await params).opportunityId)}
