import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleCreateScan } from '@/angelcare-marketplace/localization-intelligence/api-handlers'; export const dynamic='force-dynamic'; const POST__customerPlatformImpl = handleCreateScan

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'POST:/api/angelcare-marketplace/localization/scans' },
  POST__customerPlatformImpl,
)
