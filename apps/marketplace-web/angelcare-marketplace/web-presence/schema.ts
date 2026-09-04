import { createHash } from 'node:crypto'
import { WEB_PRESENCE_LOCALES, WEB_PRESENCE_SCOPES, type ValidationIssue, type ValidationResult, type WebPresenceConfiguration, type WebPresenceMediaAsset, type WebPresenceScope } from './types'

const ROOT_KEYS = ['schemaVersion','identity','localizedMetadata','icons','social','robots','sitemap','manifest','structuredData','verification','sharedMetadata']
const APPROVED_HOSTS = new Set(['my.angelcarehub.com', 'angelcarehub.com', 'www.angelcarehub.com'])
const SCRIPT = /<\/?(?:script|style|iframe|object|embed)|javascript:|data:text\/html|on\w+\s*=/i
const HEX = /^#[0-9a-f]{6}$/i
const TOKEN = /^[A-Za-z0-9._:-]{1,255}$/

function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WebPresenceInputError('VALIDATION_FAILED', `${field} doit être un objet.`)
  return value as Record<string, unknown>
}
function assertKeys(value:Record<string,unknown>,allowed:readonly string[],field:string){const unknown=Object.keys(value).filter(key=>!allowed.includes(key));if(unknown.length)throw new WebPresenceInputError('VALIDATION_FAILED',`${field} contient des clés inconnues : ${unknown.join(', ')}.`)}
function text(value: unknown, field: string, max: number, required = true): string {
  const result = String(value ?? '').trim()
  if ((required && !result) || result.length > max || SCRIPT.test(result)) throw new WebPresenceInputError('VALIDATION_FAILED', `${field} est invalide.`)
  return result
}
function optional(value: unknown, field: string, max: number): string | null { const result = text(value, field, max, false); return result || null }
function stringArray(value: unknown, field: string, max = 20): string[] {
  if (!Array.isArray(value) || value.length > max) throw new WebPresenceInputError('VALIDATION_FAILED', `${field} est invalide.`)
  return [...new Set(value.map((entry, index) => text(entry, `${field}.${index}`, 255)))]
}
function enumValue<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (!values.includes(value as T)) throw new WebPresenceInputError('VALIDATION_FAILED', `${field} est invalide.`)
  return value as T
}

export type WebPresenceErrorCode = 'VALIDATION_FAILED'|'INVALID_ASSET'|'INVALID_DOMAIN'|'INVALID_TITLE_TEMPLATE'|'STALE_REVISION'|'PUBLICATION_BLOCKED'|'PERMISSION_DENIED'|'LIVE_VERIFICATION_FAILED'
export class WebPresenceInputError extends Error {
  readonly code: WebPresenceErrorCode
  readonly status: number
  readonly field?: string
  constructor(code: WebPresenceErrorCode, message: string, status = 400, field?: string) { super(message); this.name = 'WebPresenceInputError';this.code=code;this.status=status;this.field=field }
}

export function validateCanonicalOrigin(value: unknown, production = process.env.NODE_ENV === 'production'): string {
  let url: URL
  try { url = new URL(text(value, 'identity.canonicalOrigin', 255)) } catch { throw new WebPresenceInputError('INVALID_DOMAIN', 'L’origine canonique est invalide.', 400, 'identity.canonicalOrigin') }
  if ((production && url.protocol !== 'https:') || !['https:', 'http:'].includes(url.protocol) || !APPROVED_HOSTS.has(url.hostname.toLowerCase()) || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw new WebPresenceInputError('INVALID_DOMAIN', 'Utilisez une origine AngelCare HTTPS sans chemin, identifiants, requête ni fragment.', 400, 'identity.canonicalOrigin')
  return `${url.protocol}//${url.host}`
}
export function validatePublicDomain(value:unknown):string{const domain=text(value,'identity.publicDomain',253).toLowerCase().replace(/\.$/,'');if(!APPROVED_HOSTS.has(domain))throw new WebPresenceInputError('INVALID_DOMAIN','Le domaine public doit appartenir à la liste AngelCare approuvée.',400,'identity.publicDomain');return domain}

export function validateTitleTemplate(value: unknown): string {
  const template = text(value, 'identity.titleTemplate', 120)
  if ((template.match(/%s/g) || []).length !== 1 || template.replace('%s', '').includes('%')) throw new WebPresenceInputError('INVALID_TITLE_TEMPLATE', 'Le modèle de titre doit contenir exactement un espace réservé %s.', 400, 'identity.titleTemplate')
  return template
}

export function parseWebPresenceConfiguration(value: unknown): WebPresenceConfiguration {
  const input = object(value, 'configuration')
  const unknown = Object.keys(input).filter(key => !ROOT_KEYS.includes(key))
  if (unknown.length) throw new WebPresenceInputError('VALIDATION_FAILED', `Clé de configuration inconnue : ${unknown.join(', ')}.`)
  if (input.schemaVersion !== 1) throw new WebPresenceInputError('VALIDATION_FAILED', 'schemaVersion doit être 1.')
  const identity = object(input.identity, 'identity'), localized = object(input.localizedMetadata, 'localizedMetadata'), icons = object(input.icons, 'icons'), social = object(input.social, 'social'), robots = object(input.robots, 'robots'), sitemap = object(input.sitemap, 'sitemap'), manifest = object(input.manifest, 'manifest'), structured = object(input.structuredData, 'structuredData'), verification = object(input.verification, 'verification'), shared = object(input.sharedMetadata, 'sharedMetadata')
  assertKeys(identity,['publicDomain','canonicalOrigin','siteName','siteShortName','applicationName','defaultLocale','supportedLocales','defaultTitle','titleTemplate','defaultDescription','themeColor','backgroundColor'],'identity');assertKeys(localized,WEB_PRESENCE_LOCALES,'localizedMetadata');assertKeys(icons,['favicon','highResolution','appleTouch','manifest192','manifest512','monochromeMask','organizationLogo'],'icons');assertKeys(social,['defaultImageAssetKey','openGraphSiteName','openGraphType','openGraphLocale','alternateLocales','twitterCard','twitterSite','twitterCreator'],'social');assertKeys(robots,['productionIndex','follow','imagePreview','maxSnippet'],'robots');assertKeys(sitemap,['enabled'],'sitemap');assertKeys(manifest,['name','shortName','description','startUrl','scope','display','orientation','themeColor','backgroundColor','language'],'manifest');assertKeys(structured,['organization','website'],'structuredData');assertKeys(verification,['google','bing'],'verification');assertKeys(shared,['authorsOrganization','creator','publisher','applicationName','referrer','formatDetection','category','classification'],'sharedMetadata')
  const parseIcon = (name: keyof WebPresenceConfiguration['icons']) => { const item = object(icons[name], `icons.${name}`);assertKeys(item,['assetKey','renderingMode','purpose'],`icons.${name}`); return { assetKey: optional(item.assetKey, `icons.${name}.assetKey`, 160), renderingMode: enumValue(item.renderingMode, ['CONTAIN_TRANSPARENT','CONTAIN_BRAND_BACKGROUND'] as const, `icons.${name}.renderingMode`), ...(name === 'manifest192' || name === 'manifest512' || name === 'monochromeMask' ? { purpose: enumValue(item.purpose || (name === 'monochromeMask' ? 'maskable' : 'any'), ['any','maskable'] as const, `icons.${name}.purpose`) } : {}) } }
  const localizedMetadata = Object.fromEntries(WEB_PRESENCE_LOCALES.map(locale => { const item = object(localized[locale], `localizedMetadata.${locale}`);assertKeys(item,['defaultTitle','defaultDescription','openGraphTitle','openGraphDescription','socialTitle','socialDescription','socialImageAssetKey'],`localizedMetadata.${locale}`); return [locale, { defaultTitle: text(item.defaultTitle, `${locale}.defaultTitle`, 120), defaultDescription: text(item.defaultDescription, `${locale}.defaultDescription`, 320), openGraphTitle: text(item.openGraphTitle, `${locale}.openGraphTitle`, 120), openGraphDescription: text(item.openGraphDescription, `${locale}.openGraphDescription`, 320), socialTitle: text(item.socialTitle, `${locale}.socialTitle`, 120), socialDescription: text(item.socialDescription, `${locale}.socialDescription`, 320), socialImageAssetKey: optional(item.socialImageAssetKey, `${locale}.socialImageAssetKey`, 160) }]})) as WebPresenceConfiguration['localizedMetadata']
  const organization = object(structured.organization, 'structuredData.organization'), website = object(structured.website, 'structuredData.website')
  assertKeys(organization,['legalName','brandName','canonicalUrl','description','telephone','email','address','socialProfiles','foundingDate','contactPoints'],'structuredData.organization');assertKeys(website,['siteName','alternateName','url','supportedLanguages'],'structuredData.website');assertKeys(object(shared.formatDetection,'sharedMetadata.formatDetection'),['telephone','email','address'],'sharedMetadata.formatDetection')
  const address = organization.address == null ? null : object(organization.address, 'structuredData.organization.address')
  if(address)assertKeys(address,['street','locality','region','postalCode','country'],'structuredData.organization.address')
  return {
    schemaVersion: 1,
    identity: { publicDomain: validatePublicDomain(identity.publicDomain), canonicalOrigin: validateCanonicalOrigin(identity.canonicalOrigin), siteName: text(identity.siteName, 'identity.siteName', 100), siteShortName: text(identity.siteShortName, 'identity.siteShortName', 40), applicationName: text(identity.applicationName, 'identity.applicationName', 100), defaultLocale: enumValue(identity.defaultLocale, WEB_PRESENCE_LOCALES, 'identity.defaultLocale'), supportedLocales: stringArray(identity.supportedLocales, 'identity.supportedLocales').map(item => enumValue(item, WEB_PRESENCE_LOCALES, 'identity.supportedLocales')), defaultTitle: text(identity.defaultTitle, 'identity.defaultTitle', 120), titleTemplate: validateTitleTemplate(identity.titleTemplate), defaultDescription: text(identity.defaultDescription, 'identity.defaultDescription', 320), themeColor: enumValue(identity.themeColor, [String(identity.themeColor)].filter(v => HEX.test(v)), 'identity.themeColor'), backgroundColor: enumValue(identity.backgroundColor, [String(identity.backgroundColor)].filter(v => HEX.test(v)), 'identity.backgroundColor') },
    localizedMetadata,
    icons: { favicon: parseIcon('favicon'), highResolution: parseIcon('highResolution'), appleTouch: parseIcon('appleTouch'), manifest192: parseIcon('manifest192'), manifest512: parseIcon('manifest512'), monochromeMask: parseIcon('monochromeMask'), organizationLogo: parseIcon('organizationLogo') },
    social: { defaultImageAssetKey: optional(social.defaultImageAssetKey, 'social.defaultImageAssetKey', 160), openGraphSiteName: text(social.openGraphSiteName, 'social.openGraphSiteName', 100), openGraphType: enumValue(social.openGraphType, ['website'] as const, 'social.openGraphType'), openGraphLocale: text(social.openGraphLocale, 'social.openGraphLocale', 20), alternateLocales: stringArray(social.alternateLocales, 'social.alternateLocales', 10), twitterCard: enumValue(social.twitterCard, ['summary','summary_large_image'] as const, 'social.twitterCard'), twitterSite: optional(social.twitterSite, 'social.twitterSite', 16), twitterCreator: optional(social.twitterCreator, 'social.twitterCreator', 16) },
    robots: { productionIndex: Boolean(robots.productionIndex), follow: Boolean(robots.follow), imagePreview: enumValue(robots.imagePreview, ['none','standard','large'] as const, 'robots.imagePreview'), maxSnippet: Number.isInteger(robots.maxSnippet) && Number(robots.maxSnippet) >= -1 && Number(robots.maxSnippet) <= 10000 ? Number(robots.maxSnippet) : -1 },
    sitemap: { enabled: Boolean(sitemap.enabled) },
    manifest: { name: text(manifest.name, 'manifest.name', 100), shortName: text(manifest.shortName, 'manifest.shortName', 40), description: text(manifest.description, 'manifest.description', 320), startUrl: safePath(manifest.startUrl, 'manifest.startUrl'), scope: safePath(manifest.scope, 'manifest.scope'), display: enumValue(manifest.display, ['browser','standalone','minimal-ui'] as const, 'manifest.display'), orientation: enumValue(manifest.orientation, ['any','portrait','landscape'] as const, 'manifest.orientation'), themeColor: text(manifest.themeColor, 'manifest.themeColor', 7), backgroundColor: text(manifest.backgroundColor, 'manifest.backgroundColor', 7), language: enumValue(manifest.language, WEB_PRESENCE_LOCALES, 'manifest.language') },
    structuredData: { organization: { legalName: text(organization.legalName, 'organization.legalName', 160, false), brandName: text(organization.brandName, 'organization.brandName', 100), canonicalUrl: validateCanonicalOrigin(organization.canonicalUrl), description: text(organization.description, 'organization.description', 500), telephone: optional(organization.telephone, 'organization.telephone', 40), email: optional(organization.email, 'organization.email', 160), address: address ? { street: text(address.street, 'address.street', 160), locality: text(address.locality, 'address.locality', 100), region: text(address.region, 'address.region', 100), postalCode: text(address.postalCode, 'address.postalCode', 24), country: text(address.country, 'address.country', 2) } : null, socialProfiles: stringArray(organization.socialProfiles, 'organization.socialProfiles', 12).map(url => safeHttpsUrl(url, 'organization.socialProfiles')), foundingDate: optional(organization.foundingDate, 'organization.foundingDate', 10), contactPoints: Array.isArray(organization.contactPoints) ? organization.contactPoints.slice(0,10).map((point, index) => { const row=object(point, `contactPoints.${index}`);assertKeys(row,['type','telephone','email','languages'],`contactPoints.${index}`); return { type:text(row.type,'contactPoints.type',80), telephone:text(row.telephone,'contactPoints.telephone',40), email:text(row.email,'contactPoints.email',160), languages:stringArray(row.languages,'contactPoints.languages',10) } }) : [] }, website: { siteName: text(website.siteName, 'website.siteName', 100), alternateName: text(website.alternateName, 'website.alternateName', 100), url: validateCanonicalOrigin(website.url), supportedLanguages: stringArray(website.supportedLanguages, 'website.supportedLanguages').map(item => enumValue(item, WEB_PRESENCE_LOCALES, 'website.supportedLanguages')) } },
    verification: { google: token(verification.google, 'verification.google'), bing: token(verification.bing, 'verification.bing') },
    sharedMetadata: { authorsOrganization: text(shared.authorsOrganization, 'sharedMetadata.authorsOrganization', 100), creator: text(shared.creator, 'sharedMetadata.creator', 100), publisher: text(shared.publisher, 'sharedMetadata.publisher', 100), applicationName: text(shared.applicationName, 'sharedMetadata.applicationName', 100), referrer: enumValue(shared.referrer, ['no-referrer','origin','strict-origin-when-cross-origin'] as const, 'sharedMetadata.referrer'), formatDetection: { telephone: Boolean(object(shared.formatDetection,'sharedMetadata.formatDetection').telephone), email: Boolean(object(shared.formatDetection,'sharedMetadata.formatDetection').email), address: Boolean(object(shared.formatDetection,'sharedMetadata.formatDetection').address) }, category: text(shared.category, 'sharedMetadata.category', 80), classification: text(shared.classification, 'sharedMetadata.classification', 120) },
  }
}

function safePath(value: unknown, field: string): string { const path=text(value,field,240); if(!path.startsWith('/')||path.startsWith('//')||path.includes('\\')||SCRIPT.test(path))throw new WebPresenceInputError('VALIDATION_FAILED',`${field} doit être un chemin interne.`); return path }
function safeHttpsUrl(value:string,field:string):string { let url:URL;try{url=new URL(value)}catch{throw new WebPresenceInputError('VALIDATION_FAILED',`${field} contient une URL invalide.`)}if(url.protocol!=='https:'||url.username||url.password)throw new WebPresenceInputError('VALIDATION_FAILED',`${field} exige HTTPS.`);return url.toString() }
function token(value:unknown,field:string):string|null { const result=optional(value,field,255);if(result&&!TOKEN.test(result))throw new WebPresenceInputError('VALIDATION_FAILED',`${field} est invalide.`);return result }

export function checksumConfiguration(configuration: WebPresenceConfiguration): string { return createHash('sha256').update(JSON.stringify(configuration)).digest('hex') }
export function parseScope(value: unknown): WebPresenceScope { return enumValue(value || 'MARKETPLACE', WEB_PRESENCE_SCOPES, 'scope') }

export function validateConfiguration(configuration: WebPresenceConfiguration, assets: WebPresenceMediaAsset[]): ValidationResult {
  const issues: ValidationIssue[] = [], byKey = new Map(assets.map(asset => [asset.assetKey, asset]))
  const blocker = (code:string,field:string,message:string) => issues.push({code,field,message,severity:'blocker'})
  const warning = (code:string,field:string,message:string) => issues.push({code,field,message,severity:'warning'})
  if (!configuration.identity.defaultTitle) blocker('MISSING_TITLE','identity.defaultTitle','Le titre par défaut est requis.')
  if (!configuration.identity.defaultDescription) blocker('MISSING_DESCRIPTION','identity.defaultDescription','La description par défaut est requise.')
  if (configuration.identity.canonicalOrigin !== 'https://my.angelcarehub.com') blocker('DOMAIN_OWNERSHIP_MISMATCH','identity.canonicalOrigin','Le profil de production doit utiliser https://my.angelcarehub.com.')
  if (configuration.identity.defaultTitle.length > 60) warning('TITLE_TRUNCATION','identity.defaultTitle','Le titre peut être tronqué dans les résultats de recherche.')
  if (configuration.identity.defaultDescription.length > 160) warning('DESCRIPTION_TRUNCATION','identity.defaultDescription','La description peut être tronquée.')
  const requireAsset = (field:string,key:string|null,types:string[],dimensions?:[number,number]) => { if(!key){blocker('MISSING_ASSET',field,`Un média est requis pour ${field}.`);return}const asset=byKey.get(key);if(!asset||asset.status!=='active'||!asset.rightsStatus||asset.optimizationStatus!=='ready'){blocker('INVALID_ASSET',field,'Le média doit être actif, autorisé, livrable et issu de la Media Library.');return}if(!types.includes(asset.mimeType)){blocker('INVALID_ASSET',field,`Type attendu : ${types.join(', ')}.`);return}if(dimensions&&(asset.width!==dimensions[0]||asset.height!==dimensions[1]))blocker('INVALID_ASSET_DIMENSIONS',field,`Dimensions requises : ${dimensions[0]}×${dimensions[1]}.`) }
  requireAsset('icons.favicon',configuration.icons.favicon.assetKey,['image/png','image/x-icon','image/vnd.microsoft.icon'])
  const fav=configuration.icons.favicon.assetKey?byKey.get(configuration.icons.favicon.assetKey):null;if(fav&&fav.width!==fav.height)blocker('INVALID_ASSET_DIMENSIONS','icons.favicon','Le favicon doit être carré.')
  requireAsset('icons.appleTouch',configuration.icons.appleTouch.assetKey,['image/png']);const apple=configuration.icons.appleTouch.assetKey?byKey.get(configuration.icons.appleTouch.assetKey):null;if(apple&&apple.width!==apple.height)blocker('INVALID_ASSET_DIMENSIONS','icons.appleTouch','L’icône Apple doit être carrée.');else if(apple&&(apple.width!==180||apple.height!==180))warning('APPLE_SIZE','icons.appleTouch','180×180 est recommandé.')
  requireAsset('icons.manifest192',configuration.icons.manifest192.assetKey,['image/png'],[192,192]);requireAsset('icons.manifest512',configuration.icons.manifest512.assetKey,['image/png'],[512,512])
  requireAsset('icons.organizationLogo',configuration.icons.organizationLogo.assetKey,['image/png','image/jpeg','image/webp'])
  const logo=configuration.icons.organizationLogo.assetKey?byKey.get(configuration.icons.organizationLogo.assetKey):null;if(logo&&logo.metadata.official!==true&&logo.metadata.approved_official_logo!==true)blocker('INVALID_ASSET','icons.organizationLogo','Le logo Organization doit être explicitement approuvé comme logo officiel dans la Media Library.')
  requireAsset('social.defaultImageAssetKey',configuration.social.defaultImageAssetKey,['image/png','image/jpeg','image/webp']);const social=configuration.social.defaultImageAssetKey?byKey.get(configuration.social.defaultImageAssetKey):null;if(social&&social.width&&social.height&&Math.abs(social.width/social.height-1200/630)>.08)warning('SOCIAL_RATIO','social.defaultImageAssetKey','Le ratio recommandé est environ 1.91:1 (1200×630).')
  if(!configuration.structuredData.organization.legalName)blocker('MISSING_ORGANIZATION','structuredData.organization.legalName','La raison sociale doit être renseignée avec une valeur véridique.')
  if(!configuration.manifest.startUrl.startsWith(configuration.manifest.scope.replace(/\/$/,'')))blocker('INVALID_MANIFEST','manifest.startUrl','start_url doit appartenir au scope du manifest.')
  return { valid: !issues.some(issue => issue.severity==='blocker'), blockers: issues.filter(issue=>issue.severity==='blocker'), warnings: issues.filter(issue=>issue.severity==='warning'), checkedAt:new Date().toISOString() }
}
