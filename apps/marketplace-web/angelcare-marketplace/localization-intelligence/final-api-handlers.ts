import {requireMarketplaceWorkspaceApiContext} from '../auth/context'
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
export async function handleLocalizationAuthority(request:Request){const id=requestId(request);try{const url=new URL(request.url),mode=modeOf(url.searchParams.get('mode'));await requireMarketplaceWorkspaceApiContext(`localization.${mode}`,permissionFor(mode,request.method!=='GET'));if(request.method==='GET')return apiSuccess(await loadLocalizationAuthority(mode),{requestId:id});const context=await requireMarketplaceWorkspaceApiContext(`localization.${mode}`,'marketplace.localization.access');return apiSuccess(await executeLocalizationCommand(await parseJsonObject(request),context,id,request),{requestId:id})}catch(error){return apiFailure(error,id)}}
