import { handleOrderOperate } from '@/angelcare-marketplace/enterprise-command/sovereign-api-handlers'
type Context={params:Promise<{orderId:string}>}
export async function PATCH(request:Request,context:Context){return handleOrderOperate(request,(await context.params).orderId)}
