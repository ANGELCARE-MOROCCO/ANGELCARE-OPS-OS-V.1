import type { StudioAttributionContext,StudioAttributionInput,StudioAttributionSurface } from './types'

const LIMIT=180
const clean=(value:unknown,max=LIMIT)=>{const s=value==null?'':String(value).trim();return s?s.slice(0,max):null}
const locale=(value:unknown):'fr'|'en'|'ar'=>value==='en'||value==='ar'?value:'fr'
const surface=(value:unknown):StudioAttributionSurface=>value==='studio_page'?'studio_page':'assigned_template'
const allowedKeys=['pageId','pageRoute','pageRevisionId','templateId','templateKey','templateRevisionId','templateScope','blockId','interactionId','actionId','workflowId','itemId','itemSlug','collectionId','placementId','campaignId','audienceId','territoryId','traceId','referrerHost','referrerPath','visitorHash','utmSource','utmMedium','utmCampaign','utmContent'] as const

export function sanitizeStudioAttribution(value:unknown,defaults:Partial<StudioAttributionInput>={}):StudioAttributionContext{
  const row=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
  const base=defaults as Record<string,unknown>
  const out:any={version:1,surface:surface(row.surface??base.surface),locale:locale(row.locale??base.locale)}
  for(const key of allowedKeys){const max=key==='pageRoute'||key==='referrerPath'?500:key==='referrerHost'?200:LIMIT;out[key]=clean(row[key]??base[key],max)}
  return out as StudioAttributionContext
}

export function assignedTemplateAttribution(input:{locale:string;territoryId?:string|null;audienceId?:string|null;collectionId?:string|null;placementId?:string|null;campaignId?:string|null;itemId:string;itemSlug:string;templateId?:string|null;templateKey?:string|null;templateRevisionId?:string|null;templateScope?:string|null}):StudioAttributionContext{
  return sanitizeStudioAttribution({surface:'assigned_template',locale:input.locale,territoryId:input.territoryId,audienceId:input.audienceId,collectionId:input.collectionId,placementId:input.placementId,campaignId:input.campaignId,itemId:input.itemId,itemSlug:input.itemSlug,templateId:input.templateId,templateKey:input.templateKey,templateRevisionId:input.templateRevisionId,templateScope:input.templateScope})
}

export function studioPageAttribution(input:{locale:string;pageId:string;pageRoute:string;pageRevisionId?:string|null;territoryId?:string|null;audienceId?:string|null;campaignId?:string|null}):StudioAttributionContext{
  return sanitizeStudioAttribution({surface:'studio_page',locale:input.locale,pageId:input.pageId,pageRoute:input.pageRoute,pageRevisionId:input.pageRevisionId,territoryId:input.territoryId,audienceId:input.audienceId,campaignId:input.campaignId})
}

export function studioAttributionForInteraction(base:StudioAttributionContext,input:{blockId?:string|null;interactionId?:string|null;actionId?:string|null;workflowId?:string|null;itemId?:string|null;itemSlug?:string|null;collectionId?:string|null;placementId?:string|null;campaignId?:string|null;audienceId?:string|null;territoryId?:string|null;traceId?:string|null}):StudioAttributionContext{
  return sanitizeStudioAttribution({...base,...input})
}

const queryMap={pageId:'ac_page',pageRevisionId:'ac_page_rev',templateId:'ac_tpl',templateKey:'ac_tpl_key',templateRevisionId:'ac_tpl_rev',templateScope:'ac_tpl_scope',blockId:'ac_block',interactionId:'ac_interaction',actionId:'ac_action',workflowId:'ac_workflow',itemId:'ac_item',itemSlug:'ac_item_slug',collectionId:'ac_collection',placementId:'ac_placement',campaignId:'ac_campaign',audienceId:'ac_audience',territoryId:'ac_territory',traceId:'ac_trace',utmSource:'utm_source',utmMedium:'utm_medium',utmCampaign:'utm_campaign',utmContent:'utm_content'} as const
export function hasStudioAttributionSearch(search:string):boolean{const params=new URLSearchParams(search.startsWith('?')?search.slice(1):search);return [...params.keys()].some(key=>key.startsWith('ac_'))}
export function studioAttributionFromSearch(search:string,defaults:Partial<StudioAttributionInput>={}):StudioAttributionContext{
  const params=new URLSearchParams(search.startsWith('?')?search.slice(1):search);const row:Record<string,unknown>={...defaults}
  for(const [key,param] of Object.entries(queryMap))row[key]=params.get(param)
  row.collectionId=row.collectionId||params.get('collection');row.placementId=row.placementId||params.get('placement');row.campaignId=row.campaignId||params.get('campaign');row.audienceId=row.audienceId||params.get('audience')
  return sanitizeStudioAttribution(row,defaults)
}
export function withStudioAttributionHref(href:string,attribution:StudioAttributionContext):string{
  if(!href.startsWith('/')||href.startsWith('//'))return href
  const [rawHash,...hashParts]=href.split('#');const hash=hashParts.length?`#${hashParts.join('#')}`:'';const [path,rawQuery='']=rawHash.split('?');const params=new URLSearchParams(rawQuery)
  for(const [key,param] of Object.entries(queryMap)){const value=(attribution as any)[key];if(value)params.set(param,String(value))}
  const q=params.toString();return `${path}${q?`?${q}`:''}${hash}`
}
export function studioAttributionFingerprint(value:StudioAttributionContext){return [value.surface,value.pageId,value.pageRevisionId,value.templateId,value.templateRevisionId,value.blockId,value.interactionId,value.actionId,value.workflowId,value.itemId,value.collectionId,value.placementId,value.campaignId,value.audienceId,value.territoryId,value.traceId].map(v=>v||'-').join('|')}
