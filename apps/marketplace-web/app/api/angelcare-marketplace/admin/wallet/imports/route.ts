import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import {handleAdminWalletPolicyImport} from '@/angelcare-marketplace/customer-commerce/api-handlers'
async function POST__customerPlatformImpl(request:Request){return handleAdminWalletPolicyImport(request)}

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'POST:/api/angelcare-marketplace/admin/wallet/imports' },
  POST__customerPlatformImpl,
)
