import { handleChild } from '@/angelcare-marketplace/family-experience/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{childId:string}>}){return handleChild(request,(await params).childId)}
