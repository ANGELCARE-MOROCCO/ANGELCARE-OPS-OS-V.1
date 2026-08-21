import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleCategoryNativeImportAction } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{jobId:string;action:string}>}
async function POST__customerPlatformImpl(request:Request,context:Context){return handleCategoryNativeImportAction(request,context.params)}

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'POST:/api/angelcare-marketplace/admin/category-native/imports/[jobId]/[action]' },
  POST__customerPlatformImpl,
)
