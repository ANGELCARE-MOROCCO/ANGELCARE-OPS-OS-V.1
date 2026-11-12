import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'
import {listCustomCreatives,liveCreativeCommand} from '@/angelcare-marketplace/live-experience-command/creative-360'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
export async function GET(request:Request){
 const id=requestId(request)
 try{await requireMarketplaceApiContext('marketplace.live_experience.view');return apiSuccess(await listCustomCreatives(),{requestId:id})}
 catch(error){return apiFailure(error,id)}
}
async function mutate(request:Request){
 const id=requestId(request)
 try{
  const body=await parseJsonObject(request)
  const type=body.type==='theme'?'theme':body.type==='preset'?'preset':null
  if(!type)throw new MarketplaceError('VALIDATION_ERROR','Type de création invalide.')
  const action=request.method==='DELETE'?'trash':typeof body.action==='string'?body.action:request.method==='POST'?'create':'update'
  const context=await requireMarketplaceApiContext('marketplace.live_experience.manage')
  if(action==='activate')await requireMarketplaceApiContext('marketplace.live_experience.publish')
  const record=await liveCreativeCommand(type,action,body,context)
  return apiSuccess({record},{requestId:id,status:action==='create'||action==='duplicate'?201:200})
 }catch(error){return apiFailure(error,id)}
}
export const POST=mutate
export const PATCH=mutate
export const DELETE=mutate
