import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleCategoryNativeImport } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{jobId:string}>}
async function GET__customerPlatformImpl(request:Request,context:Context){return handleCategoryNativeImport(request,context.params)}

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/admin/category-native/imports/[jobId]' },
  GET__customerPlatformImpl,
)
