import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import {handlePaymentWebhook} from '@/angelcare-marketplace/customer-commerce/api-handlers'
type Context={params:Promise<{provider:string}>}
async function POST__customerPlatformImpl(request:Request,context:Context){return handlePaymentWebhook(request,context.params)}

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'provider', operation: 'POST:/api/angelcare-marketplace/payments/webhooks/[provider]' },
  POST__customerPlatformImpl,
)
