import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import {handleFooterAnalytics} from '@/angelcare-marketplace/footer-studio/api-handlers'
const GET__customerPlatformImpl = handleFooterAnalytics

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/admin/footer-studio/analytics' },
  GET__customerPlatformImpl,
)
