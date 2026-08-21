import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleProviderDossier } from '@/angelcare-marketplace/provider-workforce/api-handlers'
async function GET__customerPlatformImpl(request:Request,{params}:{params:Promise<{providerId:string}>}){return handleProviderDossier(request,(await params).providerId)}

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'interactive', operation: 'GET:/api/angelcare-marketplace/providers/[providerId]' },
  GET__customerPlatformImpl,
)
