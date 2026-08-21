import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleAuditExportGet as GET__customerPlatformImpl } from '@/angelcare-marketplace/api/handlers'

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/foundation/audit/export' },
  GET__customerPlatformImpl,
)
