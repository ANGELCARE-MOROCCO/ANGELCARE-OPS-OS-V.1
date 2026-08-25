import {handleFrontendSurfaceSections} from '@/angelcare-marketplace/total-commerce-control/api-handlers'
type Context={params:Promise<{surfaceKey:string}>}
export async function PUT(request:Request,context:Context){return handleFrontendSurfaceSections(request,context.params)}
