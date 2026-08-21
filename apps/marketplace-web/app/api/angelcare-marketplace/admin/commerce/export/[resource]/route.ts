import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleCommerceExport } from '@/angelcare-marketplace/commerce-studio/import-export'
const GET__customerPlatformImpl = (request:Request,{params}:{params:Promise<{resource:string}>})=>params.then(({resource})=>handleCommerceExport(request,resource))

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/admin/commerce/export/[resource]' },
  GET__customerPlatformImpl,
)
