import {handlePublishFrontendSurface} from '@/angelcare-marketplace/total-commerce-control/api-handlers'
type Context={params:Promise<{surfaceKey:string}>}
export async function POST(request:Request,context:Context){return handlePublishFrontendSurface(request,context.params)}
