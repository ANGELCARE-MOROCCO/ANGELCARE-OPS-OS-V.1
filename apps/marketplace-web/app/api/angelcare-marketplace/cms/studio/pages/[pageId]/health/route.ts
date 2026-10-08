import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { loadStudioGovernance } from '@/angelcare-marketplace/studio-universal/governance'

export async function GET(request:Request,{params}:{params:Promise<{pageId:string}>}){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');const {pageId}=await params;const report=await loadStudioGovernance(pageId);return apiSuccess({healthy:report.healthy,blockers:report.blockers,performance:report.performance,parity:report.parity,page:report.page},{requestId:id})}catch(error){return apiFailure(error,id)}}
