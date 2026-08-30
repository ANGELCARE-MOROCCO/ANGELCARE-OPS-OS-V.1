import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, cleanOptionalText, cleanText, parseJsonObject, requestId, requireText } from '../server/request'
import { MarketplaceError } from '../server/errors'
import { createPage, createPreview, getPageDetail, listCtas, listMenus, listPages, listPublicationJobs, rollbackPage, saveBlocks, transitionPage, updatePage } from './repository'
import type { CmsPageStatus } from './types'
import type { MarketplacePermission } from '../domain/types'

const pageStatuses = new Set<CmsPageStatus>(['draft','submitted','in_review','approved','scheduled','published','retired','archived'])
const transitionPermission: Record<CmsPageStatus, MarketplacePermission> = {
  draft: 'marketplace.cms.edit',
  submitted: 'marketplace.cms.submit',
  in_review: 'marketplace.cms.review',
  approved: 'marketplace.cms.approve',
  scheduled: 'marketplace.cms.schedule',
  published: 'marketplace.cms.publish',
  retired: 'marketplace.cms.publish',
  archived: 'marketplace.cms.archive',
}

export async function handlePages(request: Request) {
  const id = requestId(request)
  try {
    if (request.method === 'GET') { const context = await requireMarketplaceApiContext('marketplace.cms.view'); const url = new URL(request.url); return apiSuccess(await listPages({ status: url.searchParams.get('status') || undefined, locale: url.searchParams.get('locale') || undefined, territoryId: context.territoryId }), { requestId: id }) }
    const context = await requireMarketplaceApiContext('marketplace.cms.create'); const body = await parseJsonObject(request)
    return apiSuccess(await createPage({ routeKey: requireText(body.routeKey,'routeKey','Clé de route',120), locale: cleanText(body.locale || 'fr',5), territoryId: context.territoryId, title: requireText(body.title,'title','Titre',240), navigationLabel: cleanOptionalText(body.navigationLabel,120), slug: requireText(body.slug,'slug','Slug',180), description: cleanOptionalText(body.description,2000), sensitive: Boolean(body.sensitive), seoTitle: cleanOptionalText(body.seoTitle,240), seoDescription: cleanOptionalText(body.seoDescription,500), context, requestId: id }), { requestId: id, status: 201 })
  } catch (error) { return apiFailure(error,id) }
}

export async function handlePage(request: Request, pageId: string) {
  const id=requestId(request)
  try {
    if(request.method==='GET'){await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess(await getPageDetail(pageId),{requestId:id})}
    const context=await requireMarketplaceApiContext('marketplace.cms.edit');const body=await parseJsonObject(request)
    const allowed=['title','navigation_label','slug','description','seo_title','seo_description','canonical_url','translation_status','sensitive','scheduled_at']
    const patch:Record<string,unknown>={};for(const key of allowed){if(key in body)patch[key]=body[key]}
    return apiSuccess(await updatePage({pageId,patch,changeSummary:requireText(body.changeSummary,'changeSummary','Résumé du changement',500),context,requestId:id}),{requestId:id})
  } catch(error){return apiFailure(error,id)}
}

export async function handleBlocks(request: Request,pageId:string){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.blocks.manage');const body=await parseJsonObject(request);if(!Array.isArray(body.blocks))throw new MarketplaceError('VALIDATION_ERROR','Une liste de blocs est requise.');const blocks=body.blocks.map((entry,index)=>{if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new MarketplaceError('VALIDATION_ERROR',`Bloc ${index+1} invalide.`);const block=entry as Record<string,unknown>;return{id:cleanOptionalText(block.id,100)||undefined,blockKey:requireText(block.blockKey,'blockKey','Clé du bloc',120),blockType:requireText(block.blockType,'blockType','Type du bloc',60),sortOrder:Number(block.sortOrder||index),content:block.content&&typeof block.content==='object'&&!Array.isArray(block.content)?block.content as Record<string,unknown>:{},settings:block.settings&&typeof block.settings==='object'&&!Array.isArray(block.settings)?block.settings as Record<string,unknown>:{},status:cleanText(block.status||'active',20)}});return apiSuccess(await saveBlocks({pageId,blocks,context,requestId:id}),{requestId:id})}catch(error){return apiFailure(error,id)}}

export async function handlePageTransition(request:Request,pageId:string){const id=requestId(request);try{const body=await parseJsonObject(request);const target=cleanText(body.target,30) as CmsPageStatus;if(!pageStatuses.has(target))throw new MarketplaceError('VALIDATION_ERROR','Statut cible invalide.');const context=await requireMarketplaceApiContext(transitionPermission[target]);return apiSuccess(await transitionPage({pageId,target,reason:requireText(body.reason,'reason','Motif',1000),context,requestId:id}),{requestId:id})}catch(error){return apiFailure(error,id)}}
export async function handlePageRollback(request:Request,pageId:string){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.rollback');const body=await parseJsonObject(request);return apiSuccess(await rollbackPage({pageId,versionNumber:Number(body.versionNumber),reason:requireText(body.reason,'reason','Motif',1000),context,requestId:id}),{requestId:id})}catch(error){return apiFailure(error,id)}}
export async function handleMenus(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess(await listMenus(),{requestId:id})}catch(error){return apiFailure(error,id)}}
export async function handleCtas(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess(await listCtas(),{requestId:id})}catch(error){return apiFailure(error,id)}}
export async function handlePublishing(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');return apiSuccess(await listPublicationJobs(),{requestId:id})}catch(error){return apiFailure(error,id)}}
export async function handlePreview(request:Request,pageId:string){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.preview');return apiSuccess(await createPreview({pageId,context}),{requestId:id,status:201})}catch(error){return apiFailure(error,id)}}
