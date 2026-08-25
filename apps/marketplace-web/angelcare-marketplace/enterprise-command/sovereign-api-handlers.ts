import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import { deleteSegment, listSavedSegments, mutateOperatorWorkspace, operateOrder, operatorWorkspace, saveSegment } from './sovereign-repository'

export async function handleOperatorWorkspace(request:Request){
  const rid=requestId(request)
  try{
    const context=await requireMarketplaceApiContext('marketplace.admin.access')
    if(request.method==='GET')return apiSuccess(await operatorWorkspace(context),{requestId:rid})
    if(request.method==='PATCH')return apiSuccess(await mutateOperatorWorkspace({context,body:await parseJsonObject(request),request}),{requestId:rid})
    throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')
  }catch(error){return apiFailure(error,rid)}
}

export async function handleSavedSegments(request:Request){
  const rid=requestId(request)
  try{
    const context=await requireMarketplaceApiContext('marketplace.admin.access')
    if(request.method==='GET')return apiSuccess(await listSavedSegments(context),{requestId:rid})
    if(request.method==='POST')return apiSuccess(await saveSegment({context,body:await parseJsonObject(request),request}),{requestId:rid,status:201})
    throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')
  }catch(error){return apiFailure(error,rid)}
}

export async function handleSavedSegment(request:Request,segmentId:string){
  const rid=requestId(request)
  try{
    const context=await requireMarketplaceApiContext('marketplace.admin.access')
    if(request.method==='DELETE')return apiSuccess(await deleteSegment({context,segmentId,request}),{requestId:rid})
    if(request.method==='PATCH'){const body=await parseJsonObject(request);return apiSuccess(await saveSegment({context,body:{...body,id:segmentId},request}),{requestId:rid})}
    throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')
  }catch(error){return apiFailure(error,rid)}
}

export async function handleOrderOperate(request:Request,orderId:string){
  const rid=requestId(request)
  try{
    const context=await requireMarketplaceApiContext('marketplace.operations.missions.manage')
    if(request.method!=='PATCH')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')
    return apiSuccess(await operateOrder({context,orderId,body:await parseJsonObject(request),request}),{requestId:rid})
  }catch(error){return apiFailure(error,rid)}
}
