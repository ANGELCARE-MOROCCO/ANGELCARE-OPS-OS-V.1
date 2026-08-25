import {handleProviderQualifications} from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{providerId:string}>}){return handleProviderQualifications(request,(await params).providerId)}
