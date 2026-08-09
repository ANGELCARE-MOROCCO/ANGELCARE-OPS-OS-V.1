import { handleCustomerJourney } from '@/angelcare-marketplace/journey-control/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{journeyId:string}>}){const {journeyId}=await params;return handleCustomerJourney(request,journeyId)}
