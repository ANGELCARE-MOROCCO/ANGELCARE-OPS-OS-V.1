import {handlePaymentWebhook} from '@/angelcare-marketplace/customer-commerce/api-handlers'
type Context={params:Promise<{provider:string}>}
export async function POST(request:Request,context:Context){return handlePaymentWebhook(request,context.params)}
