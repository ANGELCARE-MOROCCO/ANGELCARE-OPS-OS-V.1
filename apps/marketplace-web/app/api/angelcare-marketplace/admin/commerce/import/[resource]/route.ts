import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleCommerceImport } from '@/angelcare-marketplace/commerce-studio/import-export'
const POST__customerPlatformImpl = (request:Request,{params}:{params:Promise<{resource:string}>})=>params.then(({resource})=>handleCommerceImport(request,resource))

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'POST:/api/angelcare-marketplace/admin/commerce/import/[resource]' },
  POST__customerPlatformImpl,
)
