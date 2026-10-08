import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.admin.access');return apiSuccess(await customerRelationshipOverview(),{requestId:id})}catch(error){return apiFailure(error,id)}}
