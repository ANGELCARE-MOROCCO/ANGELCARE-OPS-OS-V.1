import {requireMarketplaceWorkspaceApiContext} from '../auth/context'
import type {MarketplacePermission} from '../domain/types'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '../server/request'
import {executeLocalizationCommand,loadLocalizationAuthority,type LocalizationAuthorityMode} from './final-repository'
const MODES=new Set<LocalizationAuthorityMode>(['translations','sources','glossary','memory','reviews','seo','readiness'])
const permissionFor=(mode:LocalizationAuthorityMode,write:boolean)=>{
 if(mode==='translations'||mode==='reviews')return write?'marketplace.localization.translations.edit':'marketplace.localization.translations.view'
 if(mode==='glossary')return write?'marketplace.localization.glossary.manage':'marketplace.localization.glossary.view'
 if(mode==='memory')return write?'marketplace.localization.memory.curate':'marketplace.localization.memory.view'
 if(mode==='sources')return write?'marketplace.localization.sources.manage':'marketplace.localization.sources.view'
 if(mode==='seo')return write?'marketplace.localization.seo.manage':'marketplace.localization.seo.view'
 return 'marketplace.localization.readiness.view'
}
function modeOf(value:string|null):LocalizationAuthorityMode{const mode=(value||'translations') as LocalizationAuthorityMode;return MODES.has(mode)?mode:'translations'}

export async function handleLocalizationAuthorityMode(request:Request,mode:LocalizationAuthorityMode){
 const id=requestId(request)
 try{
  await requireMarketplaceWorkspaceApiContext(`localization.${mode}`,permissionFor(mode,false))
  if(request.method==='GET')return apiSuccess(await loadLocalizationAuthority(mode),{requestId:id})
  const body=await parseJsonObject(request)
  const command=String(body.command||'')
  let permission=permissionFor(mode,true) as MarketplacePermission
  if(command==='translation.transition'){
   const target=String(body.to||'')
   permission=(target==='in_review'?'marketplace.localization.translations.submit':target==='approved'?'marketplace.localization.translations.approve':target==='published'?'marketplace.localization.translations.publish':target==='archived'?'marketplace.localization.translations.archive':'marketplace.localization.translations.edit')
  }else if(command==='review.decide')permission=String(body.decision)==='approve'?'marketplace.localization.translations.approve':'marketplace.localization.translations.review'
  else if(command==='memory.curate')permission='marketplace.localization.memory.curate'
  else if(command==='readiness.recalculate')permission='marketplace.localization.scans.run'
  const context=await requireMarketplaceWorkspaceApiContext(`localization.${mode}`,permission)
  return apiSuccess(await executeLocalizationCommand(body,context,id,request),{requestId:id})
 }catch(error){return apiFailure(error,id)}
}

export async function handleLocalizationAuthority(request:Request){
 const url=new URL(request.url)
 return handleLocalizationAuthorityMode(request,modeOf(url.searchParams.get('mode')))
}
