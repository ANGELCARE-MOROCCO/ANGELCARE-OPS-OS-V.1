import { handleAdminJourney } from '@/angelcare-marketplace/journey-control/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{journeyId:string}>}){const {journeyId}=await params;return handleAdminJourney(request,journeyId)}
export async function PATCH(request:Request,{params}:{params:Promise<{journeyId:string}>}){const {journeyId}=await params;return handleAdminJourney(request,journeyId)}
