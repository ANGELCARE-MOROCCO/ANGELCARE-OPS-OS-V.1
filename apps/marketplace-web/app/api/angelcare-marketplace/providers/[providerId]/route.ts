import { handleProviderDossier } from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{providerId:string}>}){return handleProviderDossier(request,(await params).providerId)}
