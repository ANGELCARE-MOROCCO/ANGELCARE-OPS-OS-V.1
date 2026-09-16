/* eslint-disable @typescript-eslint/no-unused-vars -- Request is retained in publication signatures for audit-compatible API symmetry. */
import 'server-only'
import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { writeMarketplaceAudit } from '@/angelcare-marketplace/audit/write-audit'
import { compiledWebPresence, WEB_PRESENCE_CACHE_TAG, WEB_PRESENCE_ROUTES } from './fallback'
import { nextWebPresenceVersionNumber, resolveWebPresenceAuthorityState } from './authority-state'
import { checksumConfiguration, parseWebPresenceConfiguration, validateConfiguration, validateConfigurationForPublication, WebPresenceInputError } from './schema'
import { WEB_PRESENCE_LOCALES } from './types'
import type { ValidationIssue, ValidationResult, WebPresenceConfiguration, WebPresenceHealthStatus, WebPresenceMediaAsset, WebPresenceProbeEvidence, WebPresenceProfile, WebPresenceScope, WebPresenceSnapshot, WebPresenceVerificationSummary, WebPresenceVersion } from './types'

type Row = Record<string, unknown>
const asRow = (value:unknown):Row => value && typeof value==='object' && !Array.isArray(value) ? value as Row : {}
const rows = (value:unknown):Row[] => Array.isArray(value) ? value.filter(item=>item&&typeof item==='object') as Row[] : []
const str = (value:unknown):string => typeof value==='string'?value:''
const nullable = (value:unknown):string|null => value == null ? null : String(value)

function mapProfile(row:Row):WebPresenceProfile { return { id:str(row.id),scopeKey:str(row.scope_key) as WebPresenceScope,domain:str(row.domain),defaultLocale:(str(row.default_locale)||'fr') as WebPresenceProfile['defaultLocale'],supportedLocales:(Array.isArray(row.supported_locales)?row.supported_locales:['fr','en','ar']) as WebPresenceProfile['supportedLocales'],currentPublishedVersionId:nullable(row.current_published_version_id),status:str(row.status) } }
function mapVersion(row:Row):WebPresenceVersion { return { id:str(row.id),profileId:str(row.profile_id),versionNumber:Number(row.version_number||0),lifecycleState:str(row.lifecycle_state) as WebPresenceVersion['lifecycleState'],configuration:parseWebPresenceConfiguration(row.configuration),configurationChecksum:str(row.configuration_checksum),validationResult:row.validation_result?row.validation_result as unknown as ValidationResult:null,changeSummary:nullable(row.change_summary),createdBy:nullable(row.created_by),validatedBy:nullable(row.validated_by),publishedBy:nullable(row.published_by),createdAt:str(row.created_at),validatedAt:nullable(row.validated_at),publishedAt:nullable(row.published_at) } }
function mapAsset(row:Row):WebPresenceMediaAsset { const folder=asRow(row.folder);return { id:str(row.id),assetKey:str(row.asset_key),fileName:str(row.file_name),mimeType:str(row.mime_type),sizeBytes:Number(row.size_bytes||0),width:row.width==null?null:Number(row.width),height:row.height==null?null:Number(row.height),folder:str(folder.name)||null,rightsStatus:str(row.rights_status),optimizationStatus:str(row.optimization_status),status:str(row.status),publicUrl:str(row.public_url),metadata:asRow(row.metadata) } }

function healthFromEvidence(evidence:WebPresenceProbeEvidence[]):WebPresenceHealthStatus {
  if (!evidence.length) return 'NOT_VERIFIED'
  if (evidence.some(item => item.status === 'FAIL')) return 'FAILED'
  if (evidence.some(item => item.status === 'INCONCLUSIVE')) return 'DEGRADED'
  if (evidence.some(item => item.status === 'WARN')) return 'WARNING'
  return 'HEALTHY'
}
function mapVerification(row:Row|null|undefined):WebPresenceVerificationSummary|null {
  if(!row)return null
  const rawEvidence=Array.isArray(row.evidence)?row.evidence:[]
  const evidence=rawEvidence.map((value,index)=>{
    const item=asRow(value)
    const failures=Array.isArray(item.failures)?item.failures.map(String):[]
    const warnings=Array.isArray(item.warnings)?item.warnings.map(String):[]
    const legacyResult=str(item.result)==='FAIL'?'FAIL':'PASS'
    const rawStatus=str(item.status)
    const status=(['PASS','WARN','FAIL','SKIPPED','INCONCLUSIVE'].includes(rawStatus)?rawStatus:(legacyResult==='FAIL'?'FAIL':'PASS')) as WebPresenceProbeEvidence['status']
    return {
      checkKey:str(item.checkKey)||`legacy-${index+1}`,
      label:str(item.label)||str(item.checkedUrl)||`Contrôle ${index+1}`,
      kind:(['html','asset','robots','sitemap','manifest'].includes(str(item.kind))?str(item.kind):'html') as WebPresenceProbeEvidence['kind'],
      checkedUrl:str(item.checkedUrl),
      httpStatus:Number(item.httpStatus||0),
      contentType:str(item.contentType),
      effectiveValues:asRow(item.effectiveValues),
      checkedAt:str(item.checkedAt)||str(row.checked_at),
      publishedRevision:Number(item.publishedRevision||0),
      requestId:str(item.requestId)||str(row.request_id),
      status,
      result:(status==='FAIL'?'FAIL':'PASS') as 'PASS'|'FAIL',
      failures,
      warnings,
      attempts:Number(item.attempts||1),
      latencyMs:Number(item.latencyMs||0),
    }
  })
  return {
    requestId:str(row.request_id),
    checkedAt:str(row.checked_at),
    result:str(row.result)==='FAIL'?'FAIL':'PASS',
    healthStatus:healthFromEvidence(evidence),
    versionId:nullable(row.version_id),
    publishedRevision:evidence[0]?.publishedRevision||0,
    evidence,
  }
}

async function profileByScope(scope:WebPresenceScope):Promise<WebPresenceProfile> {
  const db=await createServiceClient(), result=await db.from('angelcare_marketplace_web_presence_profiles').select('*').eq('scope_key',scope).maybeSingle()
  if(result.error||!result.data)throw new WebPresenceInputError('PUBLICATION_BLOCKED','La migration Web Presence doit être appliquée.',503)
  return mapProfile(result.data as Row)
}
async function versionById(id:string):Promise<WebPresenceVersion> { const db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_versions').select('*').eq('id',id).maybeSingle();if(result.error||!result.data)throw new WebPresenceInputError('PUBLICATION_BLOCKED','Révision Web Presence introuvable.',404);return mapVersion(result.data as Row) }
export async function listWebPresenceAssets():Promise<WebPresenceMediaAsset[]> { const db=await createServiceClient(),result=await db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,mime_type,size_bytes,width,height,rights_status,optimization_status,status,public_url,metadata,folder:angelcare_marketplace_media_folders(name)').eq('media_type','image').order('updated_at',{ascending:false}).limit(500);if(result.error)throw new WebPresenceInputError('INVALID_ASSET','La Media Library est indisponible.',503);return rows(result.data).map(mapAsset) }

const cachedPublished = unstable_cache(async(scope:WebPresenceScope):Promise<{configuration:WebPresenceConfiguration;revision:number;versionId:string|null;fallback:boolean}>=>{
  try { const profile=await profileByScope(scope);if(!profile.currentPublishedVersionId)return {configuration:compiledWebPresence(scope),revision:0,versionId:null,fallback:true};const version=await versionById(profile.currentPublishedVersionId);if(version.lifecycleState!=='PUBLISHED')throw new Error('Published pointer is inconsistent');return {configuration:version.configuration,revision:version.versionNumber,versionId:version.id,fallback:false} } catch { return {configuration:compiledWebPresence(scope),revision:0,versionId:null,fallback:true} }
},['angelcare-marketplace-web-presence-published'],{tags:[WEB_PRESENCE_CACHE_TAG]})

export async function getPublishedWebPresence(scope:WebPresenceScope){return cachedPublished(scope)}

const cachedRevision=unstable_cache(async(scope:WebPresenceScope,revision:number)=>{const profile=await profileByScope(scope),db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_versions').select('*').eq('profile_id',profile.id).eq('version_number',revision).in('lifecycle_state',['PUBLISHED','SUPERSEDED','ROLLED_BACK']).maybeSingle();if(result.error||!result.data)return null;const version=mapVersion(result.data as Row);return{configuration:version.configuration,revision:version.versionNumber,versionId:version.id,fallback:false as const}},['angelcare-marketplace-web-presence-revision'],{tags:[WEB_PRESENCE_CACHE_TAG]})
export async function getWebPresenceRevision(scope:WebPresenceScope,revision:number){const current=await getPublishedWebPresence(scope);if(!Number.isSafeInteger(revision)||revision<1)return current;if(revision===current.revision)return current;const historical=await cachedRevision(scope,revision);if(!historical)throw new WebPresenceInputError('PUBLICATION_BLOCKED',`La révision Web Presence r${revision} est introuvable ou non publiable.`,404);return historical}

export async function getWebPresenceSnapshot(scope:WebPresenceScope):Promise<WebPresenceSnapshot>{
  try { const db=await createServiceClient(),profile=await profileByScope(scope);const [versions,assets,verification]=await Promise.all([db.from('angelcare_marketplace_web_presence_versions').select('*').eq('profile_id',profile.id).order('version_number',{ascending:false}).limit(30),listWebPresenceAssets(),db.from('angelcare_marketplace_web_presence_verifications').select('*').eq('profile_id',profile.id).order('checked_at',{ascending:false}).limit(1).maybeSingle()]);if(versions.error)throw versions.error;const authority=resolveWebPresenceAuthorityState(scope,rows(versions.data).map(mapVersion),profile.currentPublishedVersionId);return {profile,...authority,mediaAssets:assets,affectedRoutes:WEB_PRESENCE_ROUTES[scope],persistenceAvailable:true,verification:mapVerification((verification.data as Row|null) || null)} } catch { const configuration=compiledWebPresence(scope);return {profile:{id:'compiled-fallback',scopeKey:scope,domain:'my.angelcarehub.com',defaultLocale:'fr',supportedLocales:['fr','en','ar'],currentPublishedVersionId:null,status:'fallback'},draft:null,published:null,effectiveConfiguration:configuration,mediaAssets:[],affectedRoutes:WEB_PRESENCE_ROUTES[scope],persistenceAvailable:false,persistenceState:'UNAVAILABLE',fallbackActive:true,verification:null} }
}

async function nextVersionNumber(profileId:string):Promise<number>{const db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_versions').select('version_number').eq('profile_id',profileId).order('version_number',{ascending:false}).limit(1).maybeSingle();if(result.error)throw result.error;return nextWebPresenceVersionNumber(result.data?.version_number)}
export async function createWebPresenceDraft(scope:WebPresenceScope,context:MarketplaceRequestContext,requestId:string,summary:string,request?:Request):Promise<WebPresenceVersion>{const db=await createServiceClient(),profile=await profileByScope(scope);const existing=await db.from('angelcare_marketplace_web_presence_versions').select('*').eq('profile_id',profile.id).in('lifecycle_state',['DRAFT','VALIDATED']).order('version_number',{ascending:false}).limit(1).maybeSingle();if(existing.data)return mapVersion(existing.data as Row);const published=profile.currentPublishedVersionId?await versionById(profile.currentPublishedVersionId):null,configuration=published?.configuration||compiledWebPresence(scope),versionNumber=await nextVersionNumber(profile.id),result=await db.from('angelcare_marketplace_web_presence_versions').insert({profile_id:profile.id,version_number:versionNumber,lifecycle_state:'DRAFT',configuration,configuration_checksum:checksumConfiguration(configuration),change_summary:summary||'Nouveau brouillon',created_by:context.actor.id}).select('*').single();if(result.error||!result.data)throw new WebPresenceInputError('STALE_REVISION','Une autre révision a été créée simultanément.',409);await writeMarketplaceAudit({context,requestId,action:'web_presence.draft.created',objectType:'web_presence_version',objectId:String(result.data.id),afterValue:{scope,versionNumber},source:'web-presence',request});return mapVersion(result.data as Row)}

export async function updateWebPresenceDraft(versionId:string,expectedRevision:number,configurationInput:unknown,summary:string,context:MarketplaceRequestContext,requestId:string,request?:Request):Promise<WebPresenceVersion>{const current=await versionById(versionId);if(current.versionNumber!==expectedRevision||!['DRAFT','VALIDATED'].includes(current.lifecycleState))throw new WebPresenceInputError('STALE_REVISION','Le brouillon a changé ou n’est plus éditable.',409);const configuration=parseWebPresenceConfiguration(configurationInput),db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_versions').update({configuration,configuration_checksum:checksumConfiguration(configuration),change_summary:summary||current.changeSummary,lifecycle_state:'DRAFT',validation_result:null,validated_by:null,validated_at:null}).eq('id',versionId).eq('version_number',expectedRevision).in('lifecycle_state',['DRAFT','VALIDATED']).select('*').maybeSingle();if(result.error||!result.data)throw new WebPresenceInputError('STALE_REVISION','Conflit de révision : rechargez le workspace.',409);await writeMarketplaceAudit({context,requestId,action:'web_presence.draft.changed',objectType:'web_presence_version',objectId:versionId,beforeValue:{checksum:current.configurationChecksum},afterValue:{checksum:checksumConfiguration(configuration)},reason:summary,source:'web-presence',request});return mapVersion(result.data as Row)}

export async function validateWebPresenceDraft(versionId:string,context:MarketplaceRequestContext,requestId:string,request?:Request):Promise<WebPresenceVersion>{const version=await versionById(versionId);if(version.lifecycleState!=='DRAFT')throw new WebPresenceInputError('VALIDATION_FAILED','Seul un brouillon peut être validé.',409);const assets=await listWebPresenceAssets(),validation=validateConfiguration(version.configuration,assets),db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_versions').update({lifecycle_state:validation.valid?'VALIDATED':'DRAFT',validation_result:validation,validated_by:validation.valid?context.actor.id:null,validated_at:validation.valid?validation.checkedAt:null}).eq('id',versionId).eq('lifecycle_state','DRAFT').select('*').maybeSingle();if(result.error||!result.data)throw new WebPresenceInputError('STALE_REVISION','Le brouillon a été modifié pendant sa validation.',409);await writeMarketplaceAudit({context,requestId,action:validation.valid?'web_presence.validation.requested':'web_presence.validation.failed',objectType:'web_presence_version',objectId:versionId,afterValue:{valid:validation.valid,blockerCodes:validation.blockers.map(item=>item.code),warningCodes:validation.warnings.map(item=>item.code)},result:validation.valid?'success':'failed',source:'web-presence',request});return mapVersion(result.data as Row)}


function publicationInputWithSafeFallback(scope: WebPresenceScope, input: unknown) {
  const fallback = compiledWebPresence(scope) as unknown as Record<string, unknown>
  const warnings: ValidationIssue[] = []
  const note = (field: string) => warnings.push({
    code: 'SAFE_FALLBACK_APPLIED',
    field,
    message: `${field} est absent; la valeur AngelCare sûre existante est conservée pour cette publication.`,
    severity: 'warning',
  })
  const walk = (base: unknown, incoming: unknown, path: string): unknown => {
    if (Array.isArray(base)) {
      if (incoming === undefined) { note(path); return structuredClone(base) }
      return incoming
    }
    if (base && typeof base === 'object') {
      if (incoming !== undefined && (!incoming || typeof incoming !== 'object' || Array.isArray(incoming))) return incoming
      const source = incoming && typeof incoming === 'object' ? incoming as Record<string, unknown> : {}
      const result: Record<string, unknown> = { ...source }
      for (const [key, value] of Object.entries(base as Record<string, unknown>)) {
        result[key] = walk(value, source[key], path ? `${path}.${key}` : key)
      }
      return result
    }
    if (typeof base === 'string' && base.trim() && (incoming === undefined || incoming === null || (typeof incoming === 'string' && !incoming.trim()))) {
      note(path)
      return base
    }
    if (incoming === undefined) {
      if (base !== null && base !== '' && base !== undefined) note(path)
      return structuredClone(base)
    }
    return incoming
  }
  const merged = walk(fallback, input, '') as Record<string, unknown>
  const structured = merged.structuredData && typeof merged.structuredData === 'object' && !Array.isArray(merged.structuredData) ? merged.structuredData as Record<string, unknown> : null
  const organization = structured?.organization && typeof structured.organization === 'object' && !Array.isArray(structured.organization) ? structured.organization as Record<string, unknown> : null
  if (organization?.address && typeof organization.address === 'object' && !Array.isArray(organization.address)) {
    const address = organization.address as Record<string, unknown>
    const complete = ['street','locality','region','postalCode','country'].every(key => typeof address[key] === 'string' && String(address[key]).trim())
    if (!complete) {
      organization.address = null
      warnings.push({ code: 'OPTIONAL_SECTION_OMITTED', field: 'structuredData.organization.address', message: 'Adresse structurée incomplète; elle est omise sans bloquer la publication.', severity: 'warning' })
    }
  }
  if (organization && Array.isArray(organization.contactPoints)) {
    const original = organization.contactPoints
    const valid = original.filter(point => {
      if (!point || typeof point !== 'object' || Array.isArray(point)) return false
      const row = point as Record<string, unknown>
      return ['type','telephone','email'].every(key => typeof row[key] === 'string' && String(row[key]).trim()) && Array.isArray(row.languages)
    })
    if (valid.length !== original.length) warnings.push({ code: 'OPTIONAL_SECTION_OMITTED', field: 'structuredData.organization.contactPoints', message: `${original.length-valid.length} point(s) de contact incomplet(s) ignoré(s); les autres valeurs seront publiées.`, severity: 'warning' })
    organization.contactPoints = valid
  }
  return { input: merged as unknown, warnings }
}

function publicationMediaSafety(configuration: WebPresenceConfiguration, assets: WebPresenceMediaAsset[]) {
  const safe = structuredClone(configuration)
  const byKey = new Map(assets.map(asset => [asset.assetKey, asset]))
  const warnings: ValidationIssue[] = []
  const usable = (key: string | null) => {
    if (!key) return true
    const asset = byKey.get(key)
    return Boolean(asset && asset.status === 'active' && asset.rightsStatus && asset.optimizationStatus === 'ready')
  }
  const drop = (field: string, message: string) => warnings.push({ code: 'ASSET_OMITTED_AT_PUBLICATION', field, message, severity: 'warning' })
  for (const slot of Object.keys(safe.icons) as Array<keyof WebPresenceConfiguration['icons']>) {
    const key = safe.icons[slot].assetKey
    if (key && !usable(key)) {
      safe.icons[slot].assetKey = null
      drop(`icons.${slot}`, `Le média ${key} n’est pas livrable actuellement; ce slot est publié sans ce média et le runtime utilisera son fallback lorsqu’il existe.`)
    }
  }
  if (safe.social.defaultImageAssetKey && !usable(safe.social.defaultImageAssetKey)) {
    const key = safe.social.defaultImageAssetKey
    safe.social.defaultImageAssetKey = null
    drop('social.defaultImageAssetKey', `L’image sociale ${key} n’est pas livrable; la publication continue avec le fallback de marque disponible.`)
  }
  for (const locale of WEB_PRESENCE_LOCALES) {
    const key = safe.localizedMetadata[locale].socialImageAssetKey
    if (key && !usable(key)) {
      safe.localizedMetadata[locale].socialImageAssetKey = null
      drop(`localizedMetadata.${locale}.socialImageAssetKey`, `L’image sociale ${locale.toUpperCase()} ${key} n’est pas livrable; la publication continue avec le fallback disponible.`)
    }
  }
  return { configuration: safe, warnings }
}

/**
 * Canonical operator path: one request saves the current configuration, performs
 * advisory validation, creates/updates the internal immutable revision, and
 * atomically publishes it. Draft/validate remain internal compatibility details.
 */
export async function publishWebPresenceOneClick(
  scope: WebPresenceScope,
  configurationInput: unknown,
  expectedCurrentRevision: number,
  summary: string,
  context: MarketplaceRequestContext,
  requestId: string,
  _request?: Request,
) {
  const preparedInput = publicationInputWithSafeFallback(scope, configurationInput)
  const parsed = parseWebPresenceConfiguration(preparedInput.input)
  const assets = await listWebPresenceAssets()
  const mediaSafe = publicationMediaSafety(parsed, assets)
  const validation = validateConfigurationForPublication(mediaSafe.configuration, assets)
  validation.warnings = [...preparedInput.warnings, ...mediaSafe.warnings, ...validation.warnings]

  const db = await createServiceClient()
  const profile = await profileByScope(scope)
  const open = await db
    .from('angelcare_marketplace_web_presence_versions')
    .select('*')
    .eq('profile_id', profile.id)
    .in('lifecycle_state', ['DRAFT', 'VALIDATED'])
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (open.error) throw new WebPresenceInputError('PUBLICATION_BLOCKED', `Préparation de publication impossible (${open.error.code || 'DB_READ'}).`, 500)

  const now = new Date().toISOString()
  const checksum = checksumConfiguration(mediaSafe.configuration)
  let prepared: WebPresenceVersion
  if (open.data) {
    const updated = await db
      .from('angelcare_marketplace_web_presence_versions')
      .update({
        configuration: mediaSafe.configuration,
        configuration_checksum: checksum,
        change_summary: summary.trim() || 'Publication Web Presence',
        lifecycle_state: 'VALIDATED',
        validation_result: validation,
        validated_by: context.actor.id,
        validated_at: now,
      })
      .eq('id', String(open.data.id))
      .in('lifecycle_state', ['DRAFT', 'VALIDATED'])
      .select('*')
      .maybeSingle()
    if (updated.error || !updated.data) throw new WebPresenceInputError('STALE_REVISION', 'La révision de travail a changé pendant la publication. Rechargez puis republiez.', 409)
    prepared = mapVersion(updated.data as Row)
  } else {
    const versionNumber = await nextVersionNumber(profile.id)
    const inserted = await db
      .from('angelcare_marketplace_web_presence_versions')
      .insert({
        profile_id: profile.id,
        version_number: versionNumber,
        lifecycle_state: 'VALIDATED',
        configuration: mediaSafe.configuration,
        configuration_checksum: checksum,
        validation_result: validation,
        change_summary: summary.trim() || 'Publication Web Presence',
        created_by: context.actor.id,
        validated_by: context.actor.id,
        validated_at: now,
      })
      .select('*')
      .single()
    if (inserted.error || !inserted.data) throw new WebPresenceInputError('STALE_REVISION', `Création de la révision de publication impossible (${inserted.error?.code || 'DB_INSERT'}). Rechargez puis republiez.`, 409)
    prepared = mapVersion(inserted.data as Row)
  }

  const call = await db.rpc('angelcare_marketplace_publish_web_presence', {
    p_profile_id: profile.id,
    p_version_id: prepared.id,
    p_expected_current_revision: expectedCurrentRevision,
    p_actor_id: context.actor.id,
    p_request_id: requestId,
  })
  if (call.error) {
    if (call.error.message.includes('STALE_REVISION')) throw new WebPresenceInputError('STALE_REVISION', 'Une publication plus récente existe déjà. Rechargez la page puis republiez.', 409)
    throw new WebPresenceInputError('PUBLICATION_BLOCKED', `La publication atomique a été refusée (${call.error.code || 'DB_RPC'}). Aucune nouvelle version n’a été activée.`, 500)
  }

  await invalidateWebPresence(scope)
  return {
    ...publicationResult(profile, { ...prepared, lifecycleState: 'PUBLISHED', publishedAt: now }, requestId, 'PUBLISHED'),
    publicationMode: 'ONE_CLICK' as const,
    warningCount: validation.warnings.length,
    warnings: validation.warnings,
    configurationChecksum: checksum,
  }
}

function publicationResult(profile:WebPresenceProfile,version:WebPresenceVersion,requestId:string,result:string){return {requestId,profileId:profile.id,versionId:version.id,revision:version.versionNumber,result,affectedScopes:[profile.scopeKey],affectedRoutes:WEB_PRESENCE_ROUTES[profile.scopeKey]}}
export async function publishWebPresence(versionId:string,expectedCurrentRevision:number,context:MarketplaceRequestContext,requestId:string,_request?:Request){const db=await createServiceClient(),version=await versionById(versionId),profile=await profileByScope((await profileForVersion(version.profileId)).scopeKey);if(version.lifecycleState!=='VALIDATED'||!version.validationResult?.valid)throw new WebPresenceInputError('PUBLICATION_BLOCKED','La révision doit être validée sans blocker.',409);const call=await db.rpc('angelcare_marketplace_publish_web_presence',{p_profile_id:profile.id,p_version_id:version.id,p_expected_current_revision:expectedCurrentRevision,p_actor_id:context.actor.id,p_request_id:requestId});if(call.error){if(call.error.message.includes('STALE_REVISION'))throw new WebPresenceInputError('STALE_REVISION','Une publication plus récente existe déjà.',409);throw new WebPresenceInputError('PUBLICATION_BLOCKED','La publication atomique a été refusée.',409)}await invalidateWebPresence(profile.scopeKey);return publicationResult(profile,{...version,lifecycleState:'PUBLISHED',publishedAt:new Date().toISOString()},requestId,'PUBLISHED')}
async function profileForVersion(profileId:string):Promise<WebPresenceProfile>{const db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_profiles').select('*').eq('id',profileId).single();if(result.error||!result.data)throw new WebPresenceInputError('PUBLICATION_BLOCKED','Profil introuvable.',404);return mapProfile(result.data as Row)}
export async function rollbackWebPresence(scope:WebPresenceScope,sourceVersionId:string,expectedCurrentRevision:number,reason:string,context:MarketplaceRequestContext,requestId:string,_request?:Request){if(reason.trim().length<10)throw new WebPresenceInputError('VALIDATION_FAILED','Une raison de restauration explicite est requise.');const db=await createServiceClient(),profile=await profileByScope(scope),call=await db.rpc('angelcare_marketplace_rollback_web_presence',{p_profile_id:profile.id,p_source_version_id:sourceVersionId,p_expected_current_revision:expectedCurrentRevision,p_reason:reason.trim(),p_actor_id:context.actor.id,p_request_id:requestId});if(call.error){if(call.error.message.includes('STALE_REVISION'))throw new WebPresenceInputError('STALE_REVISION','La révision publiée a changé.',409);throw new WebPresenceInputError('PUBLICATION_BLOCKED','La restauration atomique a été refusée.',409)}const row=asRow(call.data),version=await versionById(str(row.version_id));await invalidateWebPresence(scope);return publicationResult(profile,version,requestId,'ROLLED_BACK')}
export async function webPresenceHistory(scope:WebPresenceScope):Promise<WebPresenceVersion[]>{const profile=await profileByScope(scope),db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_versions').select('*').eq('profile_id',profile.id).order('version_number',{ascending:false}).limit(100);if(result.error)throw result.error;return rows(result.data).map(mapVersion)}
export async function invalidateWebPresence(scope:WebPresenceScope){revalidateTag(WEB_PRESENCE_CACHE_TAG,'max');revalidatePath('/','layout');revalidatePath('/angelcare-marketplace','layout');for(const path of ['/robots.txt','/sitemap.xml','/manifest.webmanifest',...WEB_PRESENCE_ROUTES[scope]])revalidatePath(path)}
export async function resolveAsset(assetKey:string){const db=await createServiceClient(),result=await db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,mime_type,size_bytes,width,height,rights_status,status,public_url,metadata,storage_bucket,storage_path').eq('asset_key',assetKey).eq('status','active').maybeSingle();if(result.error||!result.data)throw new WebPresenceInputError('INVALID_ASSET','Média publié introuvable.',404);return result.data as Row}
