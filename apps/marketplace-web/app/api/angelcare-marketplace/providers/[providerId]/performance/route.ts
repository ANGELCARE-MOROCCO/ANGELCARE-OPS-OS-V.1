import { handleProviderPerformance } from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{providerId:string}>}){return handleProviderPerformance(request,(await params).providerId)}
