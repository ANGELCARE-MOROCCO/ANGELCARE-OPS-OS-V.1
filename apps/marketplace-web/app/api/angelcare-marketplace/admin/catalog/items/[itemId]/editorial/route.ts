import {handleEditorialConfiguration} from '@/angelcare-marketplace/atomic-merchandising/api'
export const runtime='nodejs'
export const dynamic='force-dynamic'
type Context={params:Promise<{itemId:string}>}
export async function GET(request:Request,context:Context){return handleEditorialConfiguration(request,(await context.params).itemId)}
export async function PATCH(request:Request,context:Context){return handleEditorialConfiguration(request,(await context.params).itemId)}
