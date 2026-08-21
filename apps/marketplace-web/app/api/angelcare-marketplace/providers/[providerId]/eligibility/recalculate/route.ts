import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleEligibilityRecalculate } from '@/angelcare-marketplace/provider-workforce/api-handlers'
async function POST__customerPlatformImpl(request:Request,{params}:{params:Promise<{providerId:string}>}){return handleEligibilityRecalculate(request,(await params).providerId)}

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'mutation', operation: 'POST:/api/angelcare-marketplace/providers/[providerId]/eligibility/recalculate' },
  POST__customerPlatformImpl,
)
