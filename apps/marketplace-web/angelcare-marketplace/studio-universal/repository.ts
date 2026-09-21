import 'server-only'
import type { Data } from '@puckeditor/core'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { createPage, createPreview, getPageDetail, listPages, saveBlocks, transitionPage } from '@/angelcare-marketplace/experience-builder/repository'
import { writeMarketplaceAudit } from '@/angelcare-marketplace/audit/write-audit'
import { marketplaceDatabaseError } from './database-error'
import { cmsBlocksToPuckData, puckDataToCmsBlocks, rekeyComponent } from './puck-bridge'
import { studioPublicationGate } from './publication-gate'
import { evaluateStudioDocumentPolicy,assertStudioPolicy } from '@/angelcare-marketplace/studio-governance-engine/engine'
import { auditStudioPolicyDecision } from '@/angelcare-marketplace/studio-governance-engine/audit'
import { syncStudioDocumentDependencies } from '@/angelcare-marketplace/studio-dependency-invalidation/repository'
import { invalidateStudioPage } from '@/angelcare-marketplace/studio-dependency-invalidation/invalidation'
import { validateStudioPageJson } from './page-json'
import { validateBlockDocument } from '@/angelcare-marketplace/experience-builder/validation'

const slugify=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160)
const stableRouteKey=(locale:string,slug:string)=>`studio.${locale}.${slug.replace(/-/g,'.')}`.slice(0,120)

const policyPage=(page:Record<string,unknown>)=>({pageId:String(page.id||''),status:String(page.status||''),territoryId:page.territory_id?String(page.territory_id):null,locale:(['fr','en','ar'].includes(String(page.locale))?String(page.locale):'fr') as 'fr'|'en'|'ar',slug:String(page.slug||''),title:String(page.title||'')})

export async function studioPageIndex(context:MarketplaceRequestContext){return listPages({territoryId:context.territoryId})}

export async function createStudioPage(input:{title:string;slug?:string;locale?:string;description?:string|null;templatePageId?:string|null;context:MarketplaceRequestContext;requestId:string}){
  const locale=input.locale==='en'||input.locale==='ar'?input.locale:'fr'
  const slug=slugify(input.slug||input.title)
  if(!slug)throw new MarketplaceError('VALIDATION_ERROR','Une URL publique valide est requise.')
  const db=await createServiceClient()
  let existing=db.from('angelcare_marketplace_cms_pages').select('id,title,slug,locale').eq('locale',locale).eq('slug',slug)
  existing=input.context.territoryId?existing.eq('territory_id',input.context.territoryId):existing.is('territory_id',null)
  const duplicate=await existing.limit(1).maybeSingle()
  if(duplicate.error)throw marketplaceDatabaseError('vérifier l’identité de la page',duplicate.error)
  if(duplicate.data)throw new MarketplaceError('CONFLICT',`L’URL /${slug} existe déjà pour ${locale.toUpperCase()}.`)
  const page=await createPage({routeKey:stableRouteKey(locale,slug),locale,territoryId:input.context.territoryId,title:input.title.trim(),navigationLabel:input.title.trim().slice(0,120),slug,description:input.description||null,sensitive:false,seoTitle:input.title.trim(),seoDescription:input.description||`Page ${input.title.trim()} — ANGELCARE Marketplace`,context:input.context,requestId:input.requestId})
  if(input.templatePageId){const template=await getPageDetail(input.templatePageId);if(template.blocks.length)await saveBlocks({pageId:page.id,blocks:template.blocks.map((block,index)=>({blockKey:`${block.block_key}-copy-${page.id.slice(0,6)}-${index}`,blockType:block.block_type,sortOrder:index,content:block.content,settings:block.settings,status:block.status==='hidden'?'hidden':'active'})),context:input.context,requestId:input.requestId})}
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,action:'marketplace.studio.page.created',objectType:'cms_page',objectId:page.id,result:'success',severity:'info',reason:'Création depuis AngelCare Marketplace Studio',source:'angelcare-marketplace-studio'})
  return page
}

export async function loadStudioDocument(pageId:string){const detail=await getPageDetail(pageId);return {detail,data:cmsBlocksToPuckData(detail.blocks,{title:detail.page.title,locale:detail.page.locale,pageId:detail.page.id})}}

export async function duplicateStudioPage(input:{pageId:string;context:MarketplaceRequestContext;requestId:string}){
  const source=await getPageDetail(input.pageId)
  const db=await createServiceClient()
  const base=slugify(`${source.page.slug}-copie`)||`copie-${source.page.id.slice(0,8)}`
  let slug=base
  for(let index=2;index<=250;index+=1){
    let query=db.from('angelcare_marketplace_cms_pages').select('id').eq('locale',source.page.locale).eq('slug',slug)
    query=input.context.territoryId?query.eq('territory_id',input.context.territoryId):query.is('territory_id',null)
    const existing=await query.limit(1).maybeSingle()
    if(existing.error)throw marketplaceDatabaseError('préparer la duplication de page',existing.error)
    if(!existing.data)break
    slug=`${base}-${index}`
    if(index===250)throw new MarketplaceError('CONFLICT','Impossible de générer une URL libre pour la copie.')
  }
  const page=await createStudioPage({title:`${source.page.title} — copie`,slug,locale:source.page.locale,description:source.page.description,context:input.context,requestId:input.requestId})
  const sourceData=cmsBlocksToPuckData(source.blocks,{title:source.page.title,locale:source.page.locale,pageId:source.page.id})
  const suffix=`copy-${page.id.slice(0,8)}`
  const duplicatedData={...sourceData,content:(sourceData.content||[]).map(component=>rekeyComponent(component,suffix)),root:{...(sourceData.root||{}),props:{...((sourceData.root as any)?.props||{}),title:page.title,pageId:page.id}}} as Data
  await saveStudioDraft({pageId:page.id,data:duplicatedData,context:input.context,requestId:input.requestId,reason:`Duplication de ${source.page.id}`})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,action:'marketplace.studio.page.duplicated',objectType:'cms_page',objectId:page.id,result:'success',severity:'info',reason:`Copie de ${source.page.id}`,source:'angelcare-marketplace-studio',afterValue:{sourcePageId:source.page.id,slug}})
  return page
}

export async function preflightStudioDraft(input:{pageId:string;data:Data;context:MarketplaceRequestContext;requestId:string}){const current=await getPageDetail(input.pageId);const data=validateStudioPageJson(input.data);const blocks=puckDataToCmsBlocks(data);validateBlockDocument(blocks);const policy=await evaluateStudioDocumentPolicy({mode:'draft',data,context:input.context,page:policyPage(current.page as unknown as Record<string,unknown>),requestId:input.requestId});assertStudioPolicy(policy);return{data,blocks,policy}}

export async function saveStudioDraft(input:{pageId:string;data:Data;context:MarketplaceRequestContext;requestId:string;reason?:string}){
  const preflight=await preflightStudioDraft({pageId:input.pageId,data:input.data,context:input.context,requestId:input.requestId})
  const blocks=preflight.blocks
  const saved=await saveBlocks({pageId:input.pageId,blocks,context:input.context,requestId:input.requestId});await syncStudioDocumentDependencies({pageId:input.pageId,revisionId:saved.revision?.id,data:input.data})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,action:'marketplace.studio.draft.saved',objectType:'cms_page',objectId:input.pageId,result:'success',severity:'info',reason:input.reason||'Autosave Puck Studio',source:'angelcare-marketplace-studio',afterValue:{blockCount:blocks.length}})
  return {blocks:saved.blocks,data:cmsBlocksToPuckData(saved.blocks)}
}

export async function createStudioPreview(input:{pageId:string;context:MarketplaceRequestContext;requestId:string}){
  const detail=await getPageDetail(input.pageId)
  const data=cmsBlocksToPuckData(detail.blocks,{title:detail.page.title,locale:detail.page.locale,pageId:detail.page.id})
  const policy=await evaluateStudioDocumentPolicy({mode:'preview',data,context:input.context,page:policyPage(detail.page as unknown as Record<string,unknown>),requestId:input.requestId})
  if(policy.decision==='BLOCK')await auditStudioPolicyDecision({report:policy,context:input.context,requestId:input.requestId,objectId:input.pageId,action:'marketplace.studio.policy.preview_denied'})
  assertStudioPolicy(policy)
  return createPreview(input)
}

export async function publishStudioPage(input:{pageId:string;context:MarketplaceRequestContext;requestId:string;reason:string}){
  const detail=await getPageDetail(input.pageId)
  if(detail.page.status==='published')return detail.page
  const studioData=cmsBlocksToPuckData(detail.blocks,{title:detail.page.title,locale:detail.page.locale,pageId:detail.page.id})
  const policy=await evaluateStudioDocumentPolicy({mode:'publish',data:studioData,context:input.context,page:policyPage(detail.page as unknown as Record<string,unknown>),requestId:input.requestId})
  if(policy.decision==='BLOCK')await auditStudioPolicyDecision({report:policy,context:input.context,requestId:input.requestId,objectId:input.pageId,action:'marketplace.studio.policy.publish_denied'})
  assertStudioPolicy(policy)
  const gate=studioPublicationGate(studioData)
  if(!gate.pass)throw new MarketplaceError('NOT_READY',`Publication bloquée : ${gate.blockers.join(', ')}. Ouvrez Gouvernance et résolvez les éléments en revue.`)
  if(!['approved','scheduled'].includes(detail.page.status))throw new MarketplaceError('NOT_READY',`La page est ${detail.page.status}. La publication exige une validation approuvée ou planifiée.`)
  const page=await transitionPage({pageId:input.pageId,target:'published',reason:input.reason,context:input.context,requestId:input.requestId})
  await writeMarketplaceAudit({context:input.context,requestId:input.requestId,action:'marketplace.studio.page.published',objectType:'cms_page',objectId:input.pageId,result:'success',severity:'info',reason:input.reason,source:'angelcare-marketplace-studio'});await invalidateStudioPage({pageId:input.pageId,locale:String(page.locale||'fr'),slug:String(page.slug||''),reason:'Studio page published',context:input.context,requestId:input.requestId})
  return page
}
