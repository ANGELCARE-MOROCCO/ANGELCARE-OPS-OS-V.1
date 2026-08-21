import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { handleDocumentReview } from '@/angelcare-marketplace/provider-workforce/api-handlers'
async function POST__customerPlatformImpl(request:Request,{params}:{params:Promise<{providerId:string;documentId:string}>}){const p=await params;return handleDocumentReview(request,p.providerId,p.documentId)}

export const POST = governCustomerPlatformRoute(
  { workloadClass: 'mutation', operation: 'POST:/api/angelcare-marketplace/providers/[providerId]/documents/[documentId]/review' },
  POST__customerPlatformImpl,
)
