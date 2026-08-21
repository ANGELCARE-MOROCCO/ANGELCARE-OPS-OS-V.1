import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleAvailability } from '@/angelcare-marketplace/provider-workforce/api-handlers'
async function POST__customerPlatformImpl(request:Request,{params}:{params:Promise<{providerId:string}>}){return handleAvailability(request,(await params).providerId)}

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'mutation', operation: 'POST:/api/angelcare-marketplace/providers/[providerId]/availability' },
  POST__customerPlatformImpl,
)
