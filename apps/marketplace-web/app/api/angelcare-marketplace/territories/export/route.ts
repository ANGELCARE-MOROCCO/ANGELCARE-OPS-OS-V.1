import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleTerritoryExportGet as GET__customerPlatformImpl } from '@/angelcare-marketplace/territory-os/api-handlers'

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/territories/export' },
  GET__customerPlatformImpl,
)
