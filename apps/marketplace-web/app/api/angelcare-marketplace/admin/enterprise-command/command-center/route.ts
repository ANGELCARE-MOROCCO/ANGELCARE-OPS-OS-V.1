import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { marketplaceCommandCenterSnapshot } from '@/angelcare-marketplace/enterprise-command/command-center-repository'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'

export async function GET(request:Request){
 const rid=requestId(request)
 try{
  await requireMarketplaceApiContext('marketplace.admin.access')
  return apiSuccess(await marketplaceCommandCenterSnapshot(),{requestId:rid})
 }catch(error){return apiFailure(error,rid)}
}
