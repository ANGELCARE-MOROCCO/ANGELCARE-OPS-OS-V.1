import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handlePayableDecision } from '@/angelcare-marketplace/provider-workforce/api-handlers'
async function POST__customerPlatformImpl(request:Request,{params}:{params:Promise<{payableId:string}>}){return handlePayableDecision(request,(await params).payableId)}

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'mutation', operation: 'POST:/api/angelcare-marketplace/providers/payable/[payableId]/decision' },
  POST__customerPlatformImpl,
)
