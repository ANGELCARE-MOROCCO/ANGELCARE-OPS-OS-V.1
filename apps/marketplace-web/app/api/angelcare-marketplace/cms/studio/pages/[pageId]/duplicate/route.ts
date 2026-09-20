import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { duplicateStudioPage } from '@/angelcare-marketplace/studio-universal/repository'

export async function POST(request:Request,{params}:{params:Promise<{pageId:string}>}){
  const id=requestId(request)
  try{
    const context=await requireMarketplaceApiContext('marketplace.cms.create')
    const {pageId}=await params
    return apiSuccess(await duplicateStudioPage({pageId,context,requestId:id}),{requestId:id,status:201})
  }catch(error){return apiFailure(error,id)}
}
