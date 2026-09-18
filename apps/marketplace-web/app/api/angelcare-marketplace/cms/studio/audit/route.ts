import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { studioAuditSummary } from '@/angelcare-marketplace/studio-universal/audit-ledger'

export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess(studioAuditSummary(),{requestId:id})}catch(error){return apiFailure(error,id)}}
