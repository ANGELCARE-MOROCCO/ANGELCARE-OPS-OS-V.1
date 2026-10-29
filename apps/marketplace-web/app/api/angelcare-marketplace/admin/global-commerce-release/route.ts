import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure,apiSuccess,requestId } from '@/angelcare-marketplace/server/request'
import { releaseSnapshot } from '@/angelcare-marketplace/global-commerce-release/server'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function GET(request:Request){
 const id=requestId(request)
 try{await requireMarketplaceApiContext('marketplace.admin.access');return apiSuccess(await releaseSnapshot(),{requestId:id})}
 catch(error){return apiFailure(error,id)}
}
