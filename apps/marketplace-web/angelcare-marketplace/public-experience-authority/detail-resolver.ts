import 'server-only'
import type { AdaptiveExperienceData } from '@/angelcare-marketplace/category-native-experience/types'
import type { StudioResolvedTemplate, StudioTemplateResolutionCandidate } from '@/angelcare-marketplace/studio-template-assignment/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getPublicExperienceDetailAssignment, getPublicExperienceThemeManifest } from './repository'
import { evaluateDetailThemeCompatibility } from './compatibility'
import {compilePublicExperienceTheme} from './theme-compiler'
import { publicExperienceMasterDomainForDoctrine } from './registry'
import type { PublicExperienceDetailAssignment, PublicExperienceDetailScope, PublicExperienceResolvedContext } from './types'
import {safePublicExperienceKey} from './reference'
import {PEA_BUILTIN_REVISION,canonicalDetailWorld,canonicalDetailWorldById,isCanonicalBuiltinWorld} from './canonical-worlds'
import {evaluateAssignmentLifecycle} from './assignment-lifecycle'

const HIGH_SPECIFICITY=new Set(['exact_item','placement','collection','experience_schema','category'])
const text=(value:unknown)=>typeof value==='string'?value.trim():''

async function publishedTemplate(templateId:string){
  if(isCanonicalBuiltinWorld(templateId)){const builtin=canonicalDetailWorldById(templateId);return builtin?{id:builtin.id,templateKey:builtin.templateKey,revisionId:PEA_BUILTIN_REVISION}:null}
  const db=await createServiceClient();const result=await db.from('angelcare_marketplace_cms_templates').select('id,template_key,status,published_revision_id').eq('id',templateId).maybeSingle()
  if(result.error||!result.data||String(result.data.status)!=='published'||!result.data.published_revision_id)return null
  return{id:String(result.data.id),templateKey:String(result.data.template_key||''),revisionId:String(result.data.published_revision_id)}
}

async function resolveBusinessFamily(categoryKey:string|null):Promise<{key:string;label:string}|null>{
  if(!categoryKey)return null
  const db=await createServiceClient();let result=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,title,parent_category_id').eq('category_key',categoryKey).neq('status','archived').limit(1).maybeSingle();if(result.error||!result.data)return{key:safePublicExperienceKey(categoryKey),label:categoryKey}
  let row=result.data as any;const seen=new Set<string>();for(let depth=0;depth<10&&row.parent_category_id&&!seen.has(String(row.id));depth++){
    seen.add(String(row.id));const parent=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,title,parent_category_id').eq('id',String(row.parent_category_id)).neq('status','archived').maybeSingle();if(parent.error||!parent.data)break;row=parent.data
  }
  return{key:safePublicExperienceKey(text(row.category_key)||categoryKey),label:text(row.title)||text(row.category_key)||categoryKey}
}

export async function publicExperienceResolvedContext(experience:AdaptiveExperienceData):Promise<PublicExperienceResolvedContext>{
  const doctrineKey=experience.schema.schema_key;const masterDomain=publicExperienceMasterDomainForDoctrine(doctrineKey);const family=await resolveBusinessFamily(experience.item.category_key||null)
  return{doctrineKey,masterDomain,businessFamilyKey:family?.key||null,businessFamilyLabel:family?.label||null}
}

async function assignmentCandidate(scope:PublicExperienceDetailScope,key:string,masterDomain:string|null,entitySeed:string):Promise<{assignment:PublicExperienceDetailAssignment;template:{id:string;templateKey:string;revisionId:string}}|null>{
  const assignment=await getPublicExperienceDetailAssignment(scope,key);if(!assignment||!assignment.enabled)return null
  const lifecycle=evaluateAssignmentLifecycle(assignment.lifecycle,`${scope}:${key}:${entitySeed}`);if(!lifecycle.active)return null
  const [manifest,template]=await Promise.all([getPublicExperienceThemeManifest(assignment.templateId),publishedTemplate(assignment.templateId)]);if(!manifest||!template)return null
  const effectiveDomain=(masterDomain as any)||assignment.masterDomain||manifest.acceptedMasterDomains[0]||null;const compatibility=evaluateDetailThemeCompatibility({manifest,scope,key,masterDomain:effectiveDomain});if(!compatibility.compatible)return null;const compile=compilePublicExperienceTheme({manifest,masterDomain:effectiveDomain,doctrineKeys:scope==='doctrine'?[key]:manifest.acceptedDoctrineKeys});if(!compile.compatible)return null
  return{assignment,template}
}

function compatibleResolution(input:{legacy:StudioResolvedTemplate|null;experience:AdaptiveExperienceData;scope:PublicExperienceDetailScope;key:string;assignment:PublicExperienceDetailAssignment;template:{id:string;templateKey:string;revisionId:string}}):StudioResolvedTemplate{
  const legacyItem=input.legacy?.item;const authority=`Public Experience Authority · ${input.scope}`
  const peaCandidate:StudioTemplateResolutionCandidate={scope:'family',authority,assignment:{version:1,scope:'family',template:{sourceId:'content.templates',entityId:input.template.id},target:null,familyKey:`pea:${input.scope}:${input.key}`,placementId:null,enabled:true},status:'VALID',detail:`Résolution Pro Max via ${input.scope}:${input.key}.`}
  return{
    status:'RESOLVED',assignment:peaCandidate.assignment,templateId:input.template.id,templateKey:input.template.templateKey,templateRevisionId:input.template.revisionId,matchedScope:'family',
    provenance:[...(input.legacy?.provenance||[]),peaCandidate],
    item:legacyItem||{id:input.experience.item.id,slug:input.experience.item.slug,kind:input.experience.item.kind,sellableType:String(input.experience.schema.configuration?.sellable_type||input.experience.item.kind),schemaKey:input.experience.schema.schema_key,categoryId:null,categoryKey:input.experience.item.category_key||null},
  }
}

/**
 * Public Experience Authority overlays only the broad inheritance layers.
 * Exact item / placement / collection / schema / category assignments remain sovereign in P04.
 * Legacy P04 family/default remain the final backwards-compatible fallback.
 */
export async function resolvePublicExperienceDetailTemplate(input:{experience:AdaptiveExperienceData;legacyResolution:StudioResolvedTemplate|null}):Promise<{resolution:StudioResolvedTemplate|null;context:PublicExperienceResolvedContext;source:'P04_SPECIFIC'|'PEA_BUSINESS_FAMILY'|'PEA_DOCTRINE'|'PEA_MASTER_DOMAIN'|'PEA_CANONICAL_DEFAULT'|'P04_LEGACY'}>{
  const context=await publicExperienceResolvedContext(input.experience)
  if(input.legacyResolution?.status==='RESOLVED'&&input.legacyResolution.matchedScope&&HIGH_SPECIFICITY.has(input.legacyResolution.matchedScope))return{resolution:input.legacyResolution,context,source:'P04_SPECIFIC'}
  if(context.businessFamilyKey){const candidate=await assignmentCandidate('business_family',context.businessFamilyKey,context.masterDomain,input.experience.item.id);if(candidate)return{resolution:compatibleResolution({legacy:input.legacyResolution,experience:input.experience,scope:'business_family',key:context.businessFamilyKey,assignment:candidate.assignment,template:candidate.template}),context,source:'PEA_BUSINESS_FAMILY'}}
  const doctrine=await assignmentCandidate('doctrine',context.doctrineKey,context.masterDomain,input.experience.item.id);if(doctrine)return{resolution:compatibleResolution({legacy:input.legacyResolution,experience:input.experience,scope:'doctrine',key:context.doctrineKey,assignment:doctrine.assignment,template:doctrine.template}),context,source:'PEA_DOCTRINE'}
  if(context.masterDomain){const domain=await assignmentCandidate('master_domain',context.masterDomain,context.masterDomain,input.experience.item.id);if(domain)return{resolution:compatibleResolution({legacy:input.legacyResolution,experience:input.experience,scope:'master_domain',key:context.masterDomain,assignment:domain.assignment,template:domain.template}),context,source:'PEA_MASTER_DOMAIN'}
    const builtin=canonicalDetailWorld(context.masterDomain);if(builtin){const assignment:PublicExperienceDetailAssignment={version:1,scope:'master_domain',key:context.masterDomain,masterDomain:context.masterDomain,templateId:builtin.id,enabled:true,reason:'Canonical atomic default world',updatedAt:'2026-09-20T00:00:00.000Z',updatedBy:null};return{resolution:compatibleResolution({legacy:input.legacyResolution,experience:input.experience,scope:'master_domain',key:context.masterDomain,assignment,template:{id:builtin.id,templateKey:builtin.templateKey,revisionId:PEA_BUILTIN_REVISION}}),context,source:'PEA_CANONICAL_DEFAULT'}}}
  return{resolution:input.legacyResolution,context,source:'P04_LEGACY'}
}
