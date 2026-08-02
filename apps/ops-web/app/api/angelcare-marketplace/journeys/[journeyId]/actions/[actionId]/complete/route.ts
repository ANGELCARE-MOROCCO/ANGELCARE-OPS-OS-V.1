import { handleCompleteCustomerAction } from '@/angelcare-marketplace/journey-control/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{journeyId:string;actionId:string}>}){const {journeyId,actionId}=await params;return handleCompleteCustomerAction(request,journeyId,actionId)}
