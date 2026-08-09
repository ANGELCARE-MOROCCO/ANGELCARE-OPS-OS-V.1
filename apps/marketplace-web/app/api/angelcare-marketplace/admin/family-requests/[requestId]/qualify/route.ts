import { handleQualifyRequest } from '@/angelcare-marketplace/family-experience/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{requestId:string}>}){return handleQualifyRequest(request,(await params).requestId)}
