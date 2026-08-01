import { handleObjectComment } from '@/angelcare-marketplace/sovereign-control/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{objectType:string;objectId:string}>}){const p=await params;return handleObjectComment(request,p.objectType,p.objectId)}
