import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleCategoryNativeImports } from '@/angelcare-marketplace/category-native/api-handlers'
const GET__customerPlatformImpl = handleCategoryNativeImports
const POST__customerPlatformImpl = handleCategoryNativeImports

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/admin/category-native/imports' },
  GET__customerPlatformImpl,
)

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'POST:/api/angelcare-marketplace/admin/category-native/imports' },
  POST__customerPlatformImpl,
)
