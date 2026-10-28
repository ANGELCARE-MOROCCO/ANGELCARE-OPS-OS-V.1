
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure,apiSuccess,parseJsonObject,requestId } from '@/angelcare-marketplace/server/request'
import { snapshot,mutate } from '@/angelcare-marketplace/one-world-currency/server'
export const dynamic='force-dynamic'
export async function GET(request:Request){
 const id=requestId(request)
 try{await requireMarketplaceApiContext('marketplace.admin.access');return apiSuccess(await snapshot(),{requestId:id})}
 catch(e){return apiFailure(e,id)}
}
export async function POST(request:Request){
 const id=requestId(request)
 try{const ctx=await requireMarketplaceApiContext('marketplace.admin.access');return apiSuccess(await mutate(await parseJsonObject(request),ctx.actor.id),{requestId:id})}
 catch(e){return apiFailure(e,id)}
}
