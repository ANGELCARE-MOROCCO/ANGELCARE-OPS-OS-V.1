import { handleCreateRecovery } from '@/angelcare-marketplace/journey-control/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{journeyId:string}>}){const {journeyId}=await params;return handleCreateRecovery(request,journeyId)}
