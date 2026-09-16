import 'server-only'
import type { Metadata, MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { createMarketplaceMediaDeliveryUrl } from '@/angelcare-marketplace/commerce-studio/media-storage'
import { getPublishedWebPresence, getWebPresenceRevision, resolveAsset } from './repository'
import type { WebPresenceConfiguration, WebPresenceLocale, WebPresenceScope } from './types'

const ORIGIN='https://my.angelcarehub.com'
const assetUrl=(scope:WebPresenceScope,slot:string,revision:number)=>`/api/angelcare-marketplace/public/web-presence/assets/${slot}?scope=${scope}&revision=${revision}`
async function socialAssetUrl(configuration:WebPresenceConfiguration,key:string|null):Promise<string|undefined>{if(!key)return undefined;try{return String((await resolveAsset(key)).public_url||'')||undefined}catch{return undefined}}

export async function buildWebPresenceMetadata(scope:WebPresenceScope,locale:WebPresenceLocale='fr'):Promise<Metadata>{
  const {configuration:c,revision}=await getPublishedWebPresence(scope),localized=c.localizedMetadata[locale]||c.localizedMetadata[c.identity.defaultLocale],socialKey=localized.socialImageAssetKey||c.social.defaultImageAssetKey||c.icons.organizationLogo.assetKey||c.icons.highResolution.assetKey||c.icons.favicon.assetKey,socialImage=await socialAssetUrl(c,socialKey),faviconUrl=c.icons.favicon.assetKey?assetUrl(scope,'favicon',revision):'/favicon.ico',iconUrl=c.icons.highResolution.assetKey?assetUrl(scope,'icon',revision):'/favicon.ico',appleUrl=c.icons.appleTouch.assetKey?assetUrl(scope,'apple-touch-icon',revision):'/favicon.ico'
  return {
    metadataBase:new URL(c.identity.canonicalOrigin),
    title:{default:localized.defaultTitle||c.identity.defaultTitle,template:c.identity.titleTemplate},
    description:localized.defaultDescription||c.identity.defaultDescription,
    applicationName:c.sharedMetadata.applicationName,
    authors:[{name:c.sharedMetadata.authorsOrganization}],creator:c.sharedMetadata.creator,publisher:c.sharedMetadata.publisher,
    referrer:c.sharedMetadata.referrer,category:c.sharedMetadata.category,classification:c.sharedMetadata.classification,
    formatDetection:c.sharedMetadata.formatDetection,
    icons:{icon:[{url:faviconUrl},{url:iconUrl}],apple:[{url:appleUrl}]},
    openGraph:{type:'website',siteName:c.social.openGraphSiteName,locale:c.social.openGraphLocale,alternateLocale:c.social.alternateLocales,title:localized.openGraphTitle,description:localized.openGraphDescription,url:scope==='MARKETPLACE'?'/angelcare-marketplace': '/',images:socialImage?[{url:socialImage}]:undefined},
    twitter:{card:c.social.twitterCard,title:localized.socialTitle,description:localized.socialDescription,site:c.social.twitterSite||undefined,creator:c.social.twitterCreator||undefined,images:socialImage?[socialImage]:undefined},
    verification:{google:c.verification.google||undefined,other:c.verification.bing?{'msvalidate.01':[c.verification.bing]}:undefined},
    manifest:'/manifest.webmanifest',
  }
}

export async function buildRobots():Promise<MetadataRoute.Robots>{const {configuration:c}=await getPublishedWebPresence('GLOBAL_DOMAIN'),production=process.env.VERCEL_ENV==='production'||process.env.ANGELCARE_ENV==='production';const allowIndex=production&&c.robots.productionIndex;return {rules:{userAgent:'*',allow:allowIndex?'/' : undefined,disallow:allowIndex?['/api/','/admin/','/angelcare-marketplace/admin/','/angelcare-marketplace/account/','/angelcare-marketplace/family/','/angelcare-marketplace/provider/','/angelcare-marketplace/customer/','/angelcare-marketplace/preview/']:['/'],crawlDelay:allowIndex?1:undefined},sitemap:c.sitemap.enabled?`${c.identity.canonicalOrigin}/sitemap.xml`:undefined,host:c.identity.canonicalOrigin}}

type SitemapRow={url:string;lastModified?:Date;changeFrequency?:'daily'|'weekly'|'monthly';priority?:number}
export async function buildSitemap():Promise<MetadataRoute.Sitemap>{const {configuration:c}=await getPublishedWebPresence('GLOBAL_DOMAIN');if(!c.sitemap.enabled)return[];const entries=new Map<string,SitemapRow>();for(const locale of c.identity.supportedLocales)entries.set(`${ORIGIN}/angelcare-marketplace/${locale}`,{url:`${ORIGIN}/angelcare-marketplace/${locale}`,changeFrequency:'daily',priority:1});try{const db=await createServiceClient();const [pages,categories,products]=await Promise.all([db.from('angelcare_marketplace_cms_pages').select('locale,slug,canonical_url,updated_at').eq('status','published').limit(10000),db.from('angelcare_marketplace_catalog_categories').select('locale,slug,updated_at').eq('status','published').limit(10000),db.from('angelcare_marketplace_catalog_items').select('slug,updated_at').eq('status','published').limit(10000)]);for(const row of (pages.data||[]) as Array<Record<string,unknown>>){const locale=String(row.locale||'fr'),candidate=row.canonical_url?new URL(String(row.canonical_url),ORIGIN):new URL(`/angelcare-marketplace/${locale}/${String(row.slug)}`,ORIGIN);if(candidate.origin===ORIGIN&&!isProtected(candidate.pathname))entries.set(candidate.toString(),{url:candidate.toString(),lastModified:new Date(String(row.updated_at)),changeFrequency:'weekly',priority:.7})}for(const row of (categories.data||[]) as Array<Record<string,unknown>>){const url=`${ORIGIN}/angelcare-marketplace/${String(row.locale||'fr')}/marketplace/category/${encodeURIComponent(String(row.slug))}`;entries.set(url,{url,lastModified:new Date(String(row.updated_at)),changeFrequency:'weekly',priority:.8})}for(const row of (products.data||[]) as Array<Record<string,unknown>>){for(const locale of c.identity.supportedLocales){const url=`${ORIGIN}/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(String(row.slug))}`;entries.set(url,{url,lastModified:new Date(String(row.updated_at)),changeFrequency:'weekly',priority:.8})}}}catch{/* Compiled public locale roots remain available during persistence outages. */}return [...entries.values()]}
function isProtected(path:string){return path.startsWith('/api/')||path.includes('/admin/')||path.includes('/account/')||path.includes('/family/')||path.includes('/provider/')||path.includes('/preview/')}

async function manifestIcon(assetKey:string|null,slot:string,purpose:'any'|'maskable'|undefined,revision:number){if(!assetKey)return null;let sizes='any',type:string|undefined;try{const asset=await resolveAsset(assetKey),width=Number(asset.width||0),height=Number(asset.height||0);if(width>0&&height>0)sizes=`${width}x${height}`;type=String(asset.mime_type||'')||undefined}catch{/* Selection authority remains canonical; delivery endpoint will expose any real storage error. */}return {src:assetUrl('MARKETPLACE',slot,revision),sizes,type,purpose}}
export async function buildManifest():Promise<MetadataRoute.Manifest>{const {configuration:c,revision}=await getPublishedWebPresence('MARKETPLACE'),resolved=await Promise.all([manifestIcon(c.icons.manifest192.assetKey,'manifest-192',c.icons.manifest192.purpose,revision),manifestIcon(c.icons.manifest512.assetKey,'manifest-512',c.icons.manifest512.purpose,revision)]),icons=resolved.filter(Boolean) as MetadataRoute.Manifest['icons'];return {name:c.manifest.name,short_name:c.manifest.shortName,description:c.manifest.description,start_url:c.manifest.startUrl,scope:c.manifest.scope,display:c.manifest.display,orientation:c.manifest.orientation,theme_color:c.manifest.themeColor,background_color:c.manifest.backgroundColor,lang:c.manifest.language,icons}}

export async function buildStructuredData(scope:WebPresenceScope){const {configuration:c,revision}=await getPublishedWebPresence(scope),org=c.structuredData.organization,website=c.structuredData.website,logo=org.brandName&&c.icons.organizationLogo.assetKey?`${ORIGIN}${assetUrl(scope,'organization-logo',revision)}`:undefined;return [{ '@context':'https://schema.org','@type':'Organization',name:org.brandName,legalName:org.legalName||undefined,url:org.canonicalUrl,logo,description:org.description,telephone:org.telephone||undefined,email:org.email||undefined,address:org.address?{'@type':'PostalAddress',streetAddress:org.address.street,addressLocality:org.address.locality,addressRegion:org.address.region,postalCode:org.address.postalCode,addressCountry:org.address.country}:undefined,sameAs:org.socialProfiles.length?org.socialProfiles:undefined,foundingDate:org.foundingDate||undefined,contactPoint:org.contactPoints.map(point=>({'@type':'ContactPoint',contactType:point.type,telephone:point.telephone,email:point.email,availableLanguage:point.languages}))},{'@context':'https://schema.org','@type':'WebSite',name:website.siteName,alternateName:website.alternateName,url:website.url,inLanguage:website.supportedLanguages}]}

export class WebPresencePublicAssetError extends Error {
  readonly code:string
  readonly status:number
  constructor(code:string,message:string,status=404){super(message);this.name='WebPresencePublicAssetError';this.code=code;this.status=status}
}

const assetKeyForSlot=(slot:string,icons:WebPresenceConfiguration['icons'])=>slot==='favicon'?icons.favicon.assetKey:slot==='icon'?icons.highResolution.assetKey:slot==='apple-touch-icon'?icons.appleTouch.assetKey:slot==='manifest-192'?icons.manifest192.assetKey:slot==='manifest-512'?icons.manifest512.assetKey:slot==='mask-icon'?icons.monochromeMask.assetKey:slot==='organization-logo'?icons.organizationLogo.assetKey:null

async function fetchGatewayAsset(assetId:string,expectedMime:string){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12_000)
  try{
    const response=await fetch(createMarketplaceMediaDeliveryUrl(assetId,5*60*1000),{cache:'no-store',redirect:'follow',signal:controller.signal})
    if(!response.ok)throw new WebPresencePublicAssetError('MEDIA_GATEWAY_HTTP_ERROR',`Le stockage média a répondu HTTP ${response.status}.`,502)
    const contentType=response.headers.get('content-type')||expectedMime
    const blob=await response.blob()
    if(!blob.size)throw new WebPresencePublicAssetError('MEDIA_GATEWAY_EMPTY_BODY','Le stockage média a renvoyé un fichier vide.',502)
    return {blob,type:contentType}
  }catch(error){
    if(error instanceof WebPresencePublicAssetError)throw error
    if(error instanceof Error&&error.name==='AbortError')throw new WebPresencePublicAssetError('MEDIA_GATEWAY_TIMEOUT','Le stockage média n’a pas répondu dans le délai attendu.',504)
    throw new WebPresencePublicAssetError('MEDIA_GATEWAY_UNAVAILABLE','Le stockage média est indisponible.',503)
  }finally{clearTimeout(timer)}
}

export async function publicAsset(slot:string,scope:WebPresenceScope,requestedRevision:number){
  const published=await getWebPresenceRevision(scope,requestedRevision)
  const key=assetKeyForSlot(slot,published.configuration.icons)
  if(!key)throw new WebPresencePublicAssetError('ASSET_SLOT_UNCONFIGURED','Aucun média n’est configuré pour ce slot.',404)
  let asset:Awaited<ReturnType<typeof resolveAsset>>
  try{asset=await resolveAsset(key)}catch{throw new WebPresencePublicAssetError('MEDIA_RECORD_NOT_FOUND','Le média configuré n’est plus actif ou est introuvable.',404)}
  const mimeType=String(asset.mime_type||'')
  const storageBucket=String(asset.storage_bucket||'')
  let blob:Blob,type=mimeType||'application/octet-stream'
  if(storageBucket==='marketplace-windows-media'){
    const delivered=await fetchGatewayAsset(String(asset.id),mimeType)
    blob=delivered.blob
    type=delivered.type
  }else{
    const storagePath=String(asset.storage_path||'')
    if(!storageBucket||!storagePath)throw new WebPresencePublicAssetError('STORAGE_REFERENCE_MISSING','La référence de stockage du média est incomplète.',404)
    const db=await createServiceClient(),download=await db.storage.from(storageBucket).download(storagePath)
    if(download.error||!download.data)throw new WebPresencePublicAssetError('STORAGE_OBJECT_MISSING','Le fichier média n’existe pas dans son stockage déclaré.',404)
    blob=download.data
    if(!mimeType&&blob.type)type=blob.type
  }
  return {blob,type,etag:`"${published.revision}-${String(asset.id)}"`,revision:published.revision,fileName:String(asset.file_name||slot)}
}
