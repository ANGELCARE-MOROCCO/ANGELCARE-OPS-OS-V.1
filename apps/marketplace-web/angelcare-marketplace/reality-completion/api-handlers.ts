import {requireMarketplaceWorkspaceApiContext} from '../auth/context'
import {getFinalMz2Workspace} from '../final-vertical/registry'
import {apiFailure,apiSuccess,parseJsonObject,requestId,requireText} from '../server/request'
import {MarketplaceError} from '../server/errors'
import {REALITY_DOMAIN_CONTRACTS} from './domain-contract'
import {commandRealityRecord,createRealityRecord,loadRealityWorkspace} from './repository'
import {realityDomain,validateRealityAction,validateRealityCreate} from './validation'

const obj=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}

function workspace(domain:string,workspaceKey:string){
  const def=getFinalMz2Workspace(workspaceKey)
  if(!def||def.domain!==domain)throw new MarketplaceError('VALIDATION_ERROR','Workspace incompatible avec le domaine demandé.')
  return def
}

export async function handleRealityCollection(request:Request,domainValue:string){
  const rid=requestId(request)
  try{
    const domain=realityDomain(domainValue)
    if(request.method==='POST'){
      const body=await parseJsonObject(request)
      const workspaceKey=requireText(body.workspaceKey,'workspaceKey','Workspace',160)
      const def=workspace(domain,workspaceKey)
      const context=await requireMarketplaceWorkspaceApiContext(workspaceKey,REALITY_DOMAIN_CONTRACTS[domain].managePermission)
      const values=obj(body.values)
      validateRealityCreate(domain,values)
      const data=await createRealityRecord(domain,{workspaceKey,sourceId:typeof body.sourceId==='string'?body.sourceId:null,title:requireText(body.title,'title','Titre',300),values},context,rid,request)
      return apiSuccess(data,{requestId:rid,status:201})
    }
    const url=new URL(request.url)
    const workspaceKey=url.searchParams.get('workspaceKey')||''
    workspace(domain,workspaceKey)
    const context=await requireMarketplaceWorkspaceApiContext(workspaceKey,REALITY_DOMAIN_CONTRACTS[domain].managePermission)
    return apiSuccess(await loadRealityWorkspace(domain,workspaceKey,context),{requestId:rid})
  }catch(error){return apiFailure(error,rid)}
}

export async function handleRealityRecordCommand(request:Request,domainValue:string,recordId:string){
  const rid=requestId(request)
  try{
    const domain=realityDomain(domainValue)
    const body=await parseJsonObject(request)
    const workspaceKey=requireText(body.workspaceKey,'workspaceKey','Workspace',160)
    workspace(domain,workspaceKey)
    const action=requireText(body.action,'action','Commande',80)
    validateRealityAction(domain,action)
    const reason=requireText(body.reason,'reason','Raison',2500)
    const context=await requireMarketplaceWorkspaceApiContext(workspaceKey,REALITY_DOMAIN_CONTRACTS[domain].managePermission)
    return apiSuccess(await commandRealityRecord(domain,recordId,{action,reason,values:obj(body.values)},context,rid,request,workspaceKey),{requestId:rid})
  }catch(error){return apiFailure(error,rid)}
}
