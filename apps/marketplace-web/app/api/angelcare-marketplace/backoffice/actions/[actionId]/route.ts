import { handleActionUpdate } from '@/angelcare-marketplace/sovereign-control/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{actionId:string}>}){return handleActionUpdate(request,(await params).actionId)}
