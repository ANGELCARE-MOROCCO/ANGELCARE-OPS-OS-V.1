import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { apiSuccess } from '@/angelcare-marketplace/server/request'; export const dynamic='force-dynamic'; async function GET__customerPlatformImpl(){return apiSuccess({domain:'imports',status:'registered',message:'Surface Mega ZIP 03 prête et gouvernée.'})}

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'heavy', operation: 'GET:/api/angelcare-marketplace/localization/imports' },
  GET__customerPlatformImpl,
)
