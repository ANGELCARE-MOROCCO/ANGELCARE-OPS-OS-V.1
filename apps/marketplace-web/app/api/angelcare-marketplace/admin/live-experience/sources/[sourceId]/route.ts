import { handleLiveSourceStatus } from '@/angelcare-marketplace/live-experience-command/api-handlers'
type Context={params:Promise<{sourceId:string}>}
export async function PATCH(request:Request,context:Context){return handleLiveSourceStatus(request,context.params)}
