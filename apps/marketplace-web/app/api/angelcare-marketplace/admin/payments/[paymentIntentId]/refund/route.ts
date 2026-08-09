import {handleAdminPaymentRefund} from '@/angelcare-marketplace/customer-commerce/api-handlers'
type Context={params:Promise<{paymentIntentId:string}>}
export async function POST(request:Request,context:Context){return handleAdminPaymentRefund(request,context.params)}
