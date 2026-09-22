import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import { marketplaceDatabaseError } from '../studio-universal/database-error'
import type { CmsBlock, CmsMenuItem, CmsPage, CmsRevision } from '../experience-builder/types'
import type { PublicInquiryInput, PublicInquiryRecord, PublicPageExperience } from './types'

function publicError(operation: string, error: { code?: string; message?: string; details?: string; hint?: string; constraint?: string } | null) {
  return marketplaceDatabaseError(operation, error)
}
function coreMissing(error:{code?:string;message?:string}|null|undefined){return['42P01','42703'].includes(String(error?.code||''))||/cms_revisions|publication_state/.test(String(error?.message||''))}
function rec(value:unknown):Record<string,unknown>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>: {}}
function blockRows(value:unknown):CmsBlock[]{return Array.isArray(value)?value.filter((item):item is CmsBlock=>Boolean(item)&&typeof item==='object'):[]}

export function publicRoutePath(slug?: string[]): string { return slug?.filter(Boolean).join('/') || 'accueil' }
export async function listPublicInquiries(): Promise<PublicInquiryRecord[]> { const supabase = await createServiceClient(); const { data, error } = await supabase.from('angelcare_marketplace_public_inquiries').select('*').order('created_at', { ascending: false }).limit(300); if (error) throw publicError('charger les entrées publiques', error); return (data || []) as PublicInquiryRecord[] }
export async function resolveTerritoryId(code?: string | null): Promise<string | null> { if (!code) return null; const supabase = await createServiceClient(); const { data } = await supabase.from('angelcare_marketplace_territories').select('id').eq('territory_code', code).maybeSingle(); return data?.id ? String(data.id) : null }

async function hydrateCanonicalMedia(blocks:CmsBlock[]):Promise<CmsBlock[]>{
  const ids=new Set<string>();for(const block of blocks){const c=rec(block.content);if(typeof c.mediaAssetId==='string')ids.add(c.mediaAssetId);if(Array.isArray(c.items))for(const raw of c.items){const item=rec(raw);if(typeof item.mediaAssetId==='string')ids.add(item.mediaAssetId)}}
  if(!ids.size)return blocks;const db=await createServiceClient();const result=await db.from('angelcare_marketplace_media_assets').select('id,public_url,desktop_url,tablet_url,mobile_url,alt_text_fr,alt_text_en,alt_text_ar,status,rights_status,rights_expires_at').in('id',[...ids]).eq('status','active');if(result.error)return blocks
  const map=new Map((result.data||[]).map(row=>[String(row.id),row as Record<string,unknown>]));const now=Date.now()
  const resolve=(content:Record<string,unknown>)=>{const id=typeof content.mediaAssetId==='string'?content.mediaAssetId:null;if(!id)return content;const asset=map.get(id);if(!asset)return content;const expires=typeof asset.rights_expires_at==='string'?new Date(asset.rights_expires_at).valueOf():null;if(expires&&expires<now)return content;return{...content,mediaUrl:String(asset.desktop_url||asset.public_url||content.mediaUrl||''),mediaAlt:asset.alt_text_fr||content.mediaAlt||''}}
  return blocks.map(block=>{const content=resolve(rec(block.content));if(Array.isArray(content.items))content.items=content.items.map(item=>resolve(rec(item)));return{...block,content}})
}

function publishedPageSnapshot(page:CmsPage,revision:CmsRevision):CmsPage{
  const snapshot=rec(revision.page_snapshot);const has=(key:string)=>Object.prototype.hasOwnProperty.call(snapshot,key)
  const locale=String(snapshot.locale||page.published_locale||page.locale) as CmsPage['locale']
  return{...page,route_key:String(snapshot.route_key||page.route_key),locale,territory_id:has('territory_id')?(snapshot.territory_id==null?null:String(snapshot.territory_id)):page.published_territory_id??page.territory_id,title:String(snapshot.title||page.title),navigation_label:has('navigation_label')?(snapshot.navigation_label==null?null:String(snapshot.navigation_label)):page.navigation_label,slug:String(snapshot.slug||page.published_slug||page.slug),description:has('description')?(snapshot.description==null?null:String(snapshot.description)):page.description,translation_status:String(snapshot.translation_status||page.translation_status) as CmsPage['translation_status'],sensitive:typeof snapshot.sensitive==='boolean'?snapshot.sensitive:page.sensitive,seo_title:has('seo_title')?(snapshot.seo_title==null?null:String(snapshot.seo_title)):page.seo_title,seo_description:has('seo_description')?(snapshot.seo_description==null?null:String(snapshot.seo_description)):page.seo_description,canonical_url:has('canonical_url')?(snapshot.canonical_url==null?null:String(snapshot.canonical_url)):page.canonical_url}
}

async function loadPublishedExperience(page:CmsPage):Promise<{page:CmsPage;blocks:CmsBlock[]}>{
  const db=await createServiceClient();const revisionId=page.published_revision_id
  if(revisionId){const revision=await db.from('angelcare_marketplace_cms_revisions').select('*').eq('id',revisionId).eq('page_id',page.id).maybeSingle();if(!revision.error&&revision.data){const snapshot=revision.data as CmsRevision;return{page:publishedPageSnapshot(page,snapshot),blocks:await hydrateCanonicalMedia(blockRows(snapshot.document?.blocks))}}if(revision.error&&!coreMissing(revision.error))throw publicError('charger la révision publiée',revision.error)}
  if(page.published_version!=null){const revision=await db.from('angelcare_marketplace_cms_revisions').select('*').eq('page_id',page.id).eq('revision_number',page.published_version).maybeSingle();if(!revision.error&&revision.data){const snapshot=revision.data as CmsRevision;return{page:publishedPageSnapshot(page,snapshot),blocks:await hydrateCanonicalMedia(blockRows(snapshot.document?.blocks))}}if(revision.error&&!coreMissing(revision.error))throw publicError('charger la version publiée',revision.error)}
  if(page.publication_state==='published')throw new MarketplaceError('CONFIGURATION_ERROR','La page publiée ne possède aucune révision publiée résoluble. Le runtime refuse de lire le brouillon mutable.')
  const legacy=await db.from('angelcare_marketplace_cms_blocks').select('*').eq('page_id',page.id).eq('status','active').order('sort_order');if(legacy.error)throw publicError('charger les blocs',legacy.error);return{page,blocks:await hydrateCanonicalMedia((legacy.data||[]) as CmsBlock[])}
}


function isHomepageProMaxPublishedBlock(block:CmsBlock):boolean{
  const content=rec(block.content)
  const stored=rec(content.__studioPuck)
  const type=String(stored.type||'')
  return type.startsWith('ac_home_pro_max_')
}

/**
 * Canonical public Homepage bridge for the modern Studio/Puck authority.
 *
 * Blue/green doctrine:
 * - any published CMS page whose route_key belongs to the `public.home*` family
 *   may become a Homepage candidate;
 * - only a published revision containing Homepage Pro Max Puck blocks qualifies;
 * - the newest qualifying publication wins;
 * - callers can safely fall back to the legacy Homepage Flagship when none qualifies.
 *
 * This intentionally avoids hard-coding a page UUID and lets a freshly created
 * governed page supersede a legacy Homepage without mutating the old record.
 */
export async function getPublishedStudioHomepage(input:{locale:string;territoryCode?:string|null}):Promise<PublicPageExperience|null>{
  const supabase=await createServiceClient()
  const territoryId=await resolveTerritoryId(input.territoryCode||'MA-MASTER')
  const loadCandidates=async(locale:string)=>{
    let query=supabase.from('angelcare_marketplace_cms_pages').select('*')
      .eq('publication_state','published')
      .eq('published_locale',locale)
      .like('route_key','public.home%')
    if(territoryId)query=query.or(`published_territory_id.is.null,published_territory_id.eq.${territoryId}`)
    else query=query.is('published_territory_id',null)
    const modern=await query
      .order('published_at',{ascending:false,nullsFirst:false})
      .order('updated_at',{ascending:false,nullsFirst:false})
      .limit(20)
    if(!modern.error)return modern
    if(!coreMissing(modern.error))return modern
    let legacy=supabase.from('angelcare_marketplace_cms_pages').select('*')
      .eq('status','published')
      .eq('locale',locale)
      .like('route_key','public.home%')
    if(territoryId)legacy=legacy.or(`territory_id.is.null,territory_id.eq.${territoryId}`)
    else legacy=legacy.is('territory_id',null)
    return legacy.order('published_at',{ascending:false,nullsFirst:false}).order('updated_at',{ascending:false,nullsFirst:false}).limit(20)
  }
  const localized=await loadCandidates(input.locale)
  if(localized.error)throw publicError('charger les candidates Homepage Studio',localized.error)
  let candidates=(localized.data||[]) as CmsPage[]
  if(!candidates.length&&input.locale!=='fr'){
    const fallback=await loadCandidates('fr')
    if(fallback.error)throw publicError('charger la Homepage Studio française de repli',fallback.error)
    candidates=(fallback.data||[]) as CmsPage[]
  }
  for(const candidate of candidates){
    const locale=String(candidate.published_locale||candidate.locale||input.locale)
    const slug=String(candidate.published_slug||candidate.slug||'')
    if(!slug)continue
    const experience=await getPublicPage({locale,slug,territoryCode:input.territoryCode||null})
    if(!experience)continue
    if(experience.blocks.some(isHomepageProMaxPublishedBlock))return experience
  }
  return null
}

export async function getPublicPage(input: { locale: string; slug: string; territoryCode?: string | null }): Promise<PublicPageExperience | null> {
  const supabase = await createServiceClient(); const territoryId = await resolveTerritoryId(input.territoryCode || 'MA-MASTER')
  const loadPage = async (locale: string) => {
    let query = supabase.from('angelcare_marketplace_cms_pages').select('*').eq('published_locale', locale).eq('published_slug', input.slug).eq('publication_state','published')
    if (territoryId) query = query.or(`published_territory_id.is.null,published_territory_id.eq.${territoryId}`); else query = query.is('published_territory_id', null)
    const modern=await query.order('published_territory_id',{ascending:false,nullsFirst:false}).limit(1);if(!modern.error)return modern
    if(!coreMissing(modern.error))return modern
    let legacy=supabase.from('angelcare_marketplace_cms_pages').select('*').eq('locale',locale).eq('slug',input.slug).eq('status','published');if(territoryId)legacy=legacy.or(`territory_id.is.null,territory_id.eq.${territoryId}`);else legacy=legacy.is('territory_id',null);return legacy.order('territory_id',{ascending:false,nullsFirst:false}).limit(1)
  }
  const localized=await loadPage(input.locale);if(localized.error)throw publicError('charger la page',localized.error);const fallback=!localized.data?.length&&input.locale!=='fr'?await loadPage('fr'):null;if(fallback?.error)throw publicError('charger la page française de repli',fallback.error);const page=(localized.data?.[0]||fallback?.data?.[0]) as CmsPage|undefined;if(!page)return null
  const [published,localizedMenu]=await Promise.all([loadPublishedExperience(page),supabase.from('angelcare_marketplace_public_navigation_v').select('*').eq('locale', input.locale).or(territoryId ? `territory_id.is.null,territory_id.eq.${territoryId}` : 'territory_id.is.null').order('sort_order')]);if(localizedMenu.error)throw publicError('charger la navigation',localizedMenu.error)
  const fallbackMenu=!localizedMenu.data?.length&&input.locale!=='fr'?await supabase.from('angelcare_marketplace_public_navigation_v').select('*').eq('locale','fr').or(territoryId?`territory_id.is.null,territory_id.eq.${territoryId}`:'territory_id.is.null').order('sort_order'):null;if(fallbackMenu?.error)throw publicError('charger la navigation française de repli',fallbackMenu.error)
  return{page:published.page,blocks:published.blocks,navigation:(localizedMenu.data?.length?localizedMenu.data:fallbackMenu?.data||[])as CmsMenuItem[]}
}

export async function createPublicInquiry(input: PublicInquiryInput, request: Request): Promise<PublicInquiryRecord> { if (input.honeypot) throw new MarketplaceError('VALIDATION_ERROR', 'Soumission non acceptée.'); if (!input.consent) throw new MarketplaceError('VALIDATION_ERROR', 'Votre accord de contact est requis.', { fieldErrors: { consent: ['Accord requis.'] } }); if (!input.fullName.trim() || input.message.trim().length < 10) throw new MarketplaceError('VALIDATION_ERROR', 'Nom et besoin détaillé sont requis.'); if (!input.email?.trim() && !input.phone?.trim()) throw new MarketplaceError('VALIDATION_ERROR', 'Un email ou un téléphone est requis.'); const supabase = await createServiceClient(); const territoryId = await resolveTerritoryId(input.territoryCode || 'MA-MASTER'); const fingerprint = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null; const { data, error } = await supabase.from('angelcare_marketplace_public_inquiries').insert({ audience: input.audience, source_route: input.sourceRoute, full_name: input.fullName.trim(), email: input.email?.trim() || null, phone: input.phone?.trim() || null, organization: input.organization?.trim() || null, city: input.city?.trim() || null, message: input.message.trim(), consent_granted_at: new Date().toISOString(), locale: input.locale, territory_id: territoryId, request_fingerprint: fingerprint, source_metadata: input.sourceMetadata || {} }).select('*').single(); if (error || !data) throw publicError('enregistrer votre demande', error); await supabase.from('angelcare_marketplace_public_events').insert({ event_name: 'public_inquiry_submitted', route: input.sourceRoute, locale: input.locale, territory_id: territoryId, inquiry_id: data.id, event_data: { audience: input.audience, ...(input.sourceMetadata || {}) } }); return data as PublicInquiryRecord }
export async function recordPublicEvent(input: { eventName: string; route: string; locale: string; territoryCode?: string | null; data?: Record<string, unknown> }) { const supabase = await createServiceClient(); const territoryId = await resolveTerritoryId(input.territoryCode || 'MA-MASTER'); await supabase.from('angelcare_marketplace_public_events').insert({ event_name: input.eventName, route: input.route, locale: input.locale, territory_id: territoryId, event_data: input.data || {} }) }
