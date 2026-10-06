import { handleCustomerAddress } from '@/angelcare-marketplace/customer-commerce/api-handlers'
type Context={params:Promise<{addressId:string}>}
export async function PATCH(request:Request,context:Context){return handleCustomerAddress(request,(await context.params).addressId)}
