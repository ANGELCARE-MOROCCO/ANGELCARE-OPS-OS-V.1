import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot, requestApproval } from '@/lib/homeservice-design/server/repository'
export async function GET(){try{await requireHomeServiceApi('homeservice_design.review');return apiOk((await getServiceDesignSnapshot()).approvals)}catch(e){return apiError(e)}}
export async function POST(request: Request){try{const user=await requireHomeServiceApi('homeservice_design.review');const result=await requestApproval(await jsonBody(request),user);return apiOk(result.data,201,result.correlationId)}catch(e){return apiError(e)}}
