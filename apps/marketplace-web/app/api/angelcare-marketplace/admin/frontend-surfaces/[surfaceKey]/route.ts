import {handleFrontendSurface} from '@/angelcare-marketplace/total-commerce-control/api-handlers'
type Context={params:Promise<{surfaceKey:string}>}
export async function GET(request:Request,context:Context){return handleFrontendSurface(request,context.params)}
export async function PATCH(request:Request,context:Context){return handleFrontendSurface(request,context.params)}
