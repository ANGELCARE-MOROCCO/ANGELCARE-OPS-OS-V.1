import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { hasMarketplacePermission } from '@/angelcare-marketplace/auth/context'
import type { MarketplacePermission, MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { writeMarketplaceAudit } from '@/angelcare-marketplace/audit/write-audit'
import { validateStudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/resolver'
import { STUDIO_TEMPLATE_ASSIGNMENT_VERSION, type StudioTemplateAssignment, type StudioTemplateAssignmentRecord, type StudioTemplateAssignmentScope, type StudioTemplateAssignmentWriteInput, type StudioTemplateFamilyOption, type StudioTemplatePlacementOption } from './types'
import { assignmentFromContainer, containerWithAssignment, familyConfigKey, placementConfigKey, safeFamilyKey, safePlacementId, STUDIO_TEMPLATE_DEFAULT_CONFIG_KEY } from './reference'
import { invalidateStudioAssignment } from '@/angelcare-marketplace/studio-dependency-invalidation/invalidation'

type Row=Record<string,unknown>
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const text=(v:unknown)=>typeof v==='string'?v.trim():''

const SCOPE_TARGET_SOURCE:Partial<Record<StudioTemplateAssignmentScope,string>>={exact_item:'catalog.items',collection:'homepage.collections',experience_schema:'experience.schemas',category:'catalog.categories'}
const SCOPE_PERMISSION:Record<StudioTemplateAssignmentScope,MarketplacePermission>={exact_item:'marketplace.catalog.manage',placement:'marketplace.homepage.manage',collection:'marketplace.homepage.manage',experience_schema:'marketplace.experience_schema.manage',category:'marketplace.catalog.manage',family:'marketplace.configuration.manage',marketplace_default:'marketplace.configuration.manage'}
const TARGETS:Record<string,{table:string;select:string;column:string}>={
  'catalog.items':{table:'angelcare_marketplace_catalog_items',select:'id,name_fr,status,experience_config',column:'experience_config'},
  'catalog.categories':{table:'angelcare_marketplace_catalog_categories',select:'id,title,status,experience_config',column:'experience_config'},
  'homepage.collections':{table:'angelcare_marketplace_homepage_collections',select:'id,title,status,settings',column:'settings'},
  'experience.schemas':{table:'angelcare_marketplace_experience_schemas',select:'id,name_fr,status,configuration',column:'configuration'},
}

function assertManage(scope:StudioTemplateAssignmentScope,context:MarketplaceRequestContext){if(!hasMarketplacePermission(context,SCOPE_PERMISSION[scope]))throw new MarketplaceError('PERMISSION_DENIED',`Permission ${SCOPE_PERMISSION[scope]} requise.`)}
async function publishedTemplate(templateId:string){const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_cms_templates').select('id,name,template_key,status,published_revision_id,updated_at').eq('id',templateId).maybeSingle();if(error||!data)throw new MarketplaceError('NOT_FOUND','Template Experience Core introuvable.');if(String(data.status)!=='published'||!data.published_revision_id)throw new MarketplaceError('INVALID_STATE_TRANSITION','Le template doit être publié avant assignation.');return data as Row}
async function existingTarget(sourceId:string,id:string){const db=await createServiceClient();const def=TARGETS[sourceId];if(!def)throw new MarketplaceError('VALIDATION_ERROR','Source cible non supportée par P04.');const{data,error}=await db.from(def.table).select(def.select).eq('id',id).maybeSingle();if(error||!data)throw new MarketplaceError('NOT_FOUND','Cible d’assignation introuvable.');return{row:data as unknown as Row,def}}
function createAssignment(input:StudioTemplateAssignmentWriteInput):StudioTemplateAssignment|null{if(!input.template)return null;return{version:STUDIO_TEMPLATE_ASSIGNMENT_VERSION,scope:input.scope,template:input.template,target:input.target||null,familyKey:input.familyKey?safeFamilyKey(input.familyKey):null,placementId:input.placementId?safePlacementId(input.placementId):null,enabled:true}}

async function setConfig(key:string,label:string,value:StudioTemplateAssignment|null,context:MarketplaceRequestContext){
  const db=await createServiceClient();const current=await db.from('angelcare_marketplace_configurations').select('*').eq('config_key',key).is('territory_id',null).is('tenant_id',null).is('locale',null).maybeSingle();if(current.error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de lire la configuration Studio Template.',{cause:current.error})
  if(!value){if(!current.data)return{before:null,after:null};const removed=await db.from('angelcare_marketplace_configurations').delete().eq('id',current.data.id);if(removed.error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de retirer l’assignation template.',{cause:removed.error});return{before:current.data,after:null}}
  if(current.data){const result=await db.from('angelcare_marketplace_configurations').update({value,version:Number(current.data.version||1)+1,updated_by:context.actor.id,updated_at:new Date().toISOString()}).eq('id',current.data.id).select('*').single();if(result.error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de mettre à jour l’assignation template.',{cause:result.error});return{before:current.data,after:result.data}}
  const result=await db.from('angelcare_marketplace_configurations').insert({config_key:key,label,description:'Assignation de template Studio gouvernée par P04.',value,value_type:'json',category:'Studio Templates',editable:true,sensitive:false,territory_id:null,tenant_id:null,locale:null,version:1,updated_by:context.actor.id}).select('*').single();if(result.error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de créer la configuration d’assignation.',{cause:result.error});return{before:null,after:result.data}
}

export async function saveStudioTemplateAssignment(input:StudioTemplateAssignmentWriteInput,context:MarketplaceRequestContext,requestId:string):Promise<StudioTemplateAssignmentRecord|null>{
  assertManage(input.scope,context);if(!input.reason.trim())throw new MarketplaceError('VALIDATION_ERROR','Une raison est requise pour modifier l’héritage template.')
  const next=createAssignment(input);let template:Row|null=null;if(next)template=await publishedTemplate(next.template.entityId)
  const expectedSource=SCOPE_TARGET_SOURCE[input.scope];if(expectedSource&&(!input.target||input.target.sourceId!==expectedSource))throw new MarketplaceError('VALIDATION_ERROR',`La portée ${input.scope} exige une cible ${expectedSource}.`)
  if(input.scope==='family'&&!safeFamilyKey(input.familyKey))throw new MarketplaceError('VALIDATION_ERROR','Une famille Marketplace valide est requise.')
  if(input.scope==='placement'&&!safePlacementId(input.placementId))throw new MarketplaceError('VALIDATION_ERROR','Un placement contextuel valide est requis.')
  let authority='',targetLabel='Marketplace';let before:unknown=null,after:unknown=null
  if(expectedSource&&input.target){
    const target=await existingTarget(expectedSource,input.target.entityId);const row=target.row;targetLabel=text(row.name_fr)||text(row.title)||input.target.entityId;before=row[target.def.column];after=containerWithAssignment(row[target.def.column],next);const db=await createServiceClient();const result=await db.from(target.def.table).update({[target.def.column]:after,updated_at:new Date().toISOString(),updated_by:context.actor.id}).eq('id',input.target.entityId).select('id').single();if(result.error)throw new MarketplaceError('INTERNAL_ERROR','Impossible d’enregistrer l’assignation template.',{cause:result.error});authority=`${target.def.table}.${target.def.column}`
  }else if(input.scope==='family'){
    const family=safeFamilyKey(input.familyKey);const result=await setConfig(familyConfigKey(family),`Template Studio · famille ${family}`,next,context);authority='angelcare_marketplace_configurations';targetLabel=family;before=result.before;after=result.after
  }else if(input.scope==='placement'){
    const placementId=safePlacementId(input.placementId);const db=await createServiceClient();const placement=await db.from('angelcare_marketplace_homepage_placements').select('id,placement_key,status').eq('id',placementId).maybeSingle();if(placement.error||!placement.data)throw new MarketplaceError('NOT_FOUND','Placement contextuel introuvable.');const result=await setConfig(placementConfigKey(placementId),`Template Studio · placement ${String(placement.data.placement_key||placementId)}`,next,context);authority='angelcare_marketplace_configurations';targetLabel=String(placement.data.placement_key||placementId);before=result.before;after=result.after
  }else{
    const result=await setConfig(STUDIO_TEMPLATE_DEFAULT_CONFIG_KEY,'Template Studio Marketplace par défaut',next,context);authority='angelcare_marketplace_configurations';targetLabel='Marketplace par défaut';before=result.before;after=result.after
  }
  await writeMarketplaceAudit({context,requestId,action:next?'marketplace.studio.template_assignment.saved':'marketplace.studio.template_assignment.removed',objectType:'studio_template_assignment',objectId:input.target?.entityId||safeFamilyKey(input.familyKey)||safePlacementId(input.placementId)||input.scope,beforeValue:before,afterValue:after,reason:input.reason,severity:'warning',source:'studio-p04-template-assignment'});await invalidateStudioAssignment({scope:input.scope,target:input.target||null,templateId:input.template?.entityId||null,reason:input.reason,context,requestId})
  return next?{...next,authority,targetLabel,templateLabel:template?text(template.name):null,updatedAt:new Date().toISOString()}:null
}

export async function readStudioTemplateAssignment(input:{scope:StudioTemplateAssignmentScope;target?:{sourceId:string;entityId:string}|null;familyKey?:string|null;placementId?:string|null},context:MarketplaceRequestContext):Promise<StudioTemplateAssignmentRecord|null>{
  const expected=SCOPE_TARGET_SOURCE[input.scope];let stored:StudioTemplateAssignment|null=null,authority='',targetLabel='Marketplace',updatedAt:string|null=null
  if(expected&&input.target){const target=await existingTarget(expected,input.target.entityId);const row=target.row;stored=assignmentFromContainer(row[target.def.column],input.scope);authority=`${target.def.table}.${target.def.column}`;targetLabel=text(row.name_fr)||text(row.title)||input.target.entityId}
  else{
    const db=await createServiceClient();const key=input.scope==='family'?familyConfigKey(input.familyKey||''):input.scope==='placement'?placementConfigKey(input.placementId||''):STUDIO_TEMPLATE_DEFAULT_CONFIG_KEY;const{data,error}=await db.from('angelcare_marketplace_configurations').select('value,updated_at').eq('config_key',key).is('territory_id',null).is('tenant_id',null).is('locale',null).maybeSingle();if(error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de lire l’assignation template.',{cause:error});stored=data?assignmentFromContainer({studio_template_assignment:data.value},input.scope):null;updatedAt=data?String(data.updated_at||''):null;authority='angelcare_marketplace_configurations';targetLabel=input.scope==='family'?(input.familyKey||'Famille'):input.scope==='placement'?'Placement contextuel':'Marketplace par défaut'
  }
  if(!stored)return null
  const validation=await validateStudioSourceReference(stored.template,{context:{locale:context.locale,territoryId:context.territoryId}},context).catch(()=>null)
  return{...stored,authority,targetLabel,templateLabel:validation?.entity?.title||null,updatedAt}
}

export async function listStudioTemplateFamilies():Promise<StudioTemplateFamilyOption[]>{
  const db=await createServiceClient();const [schemas,items]=await Promise.all([db.from('angelcare_marketplace_experience_schemas').select('configuration').eq('status','active').limit(500),db.from('angelcare_marketplace_catalog_items').select('kind,sellable_type').neq('status','archived').limit(500)])
  const counts=new Map<string,{label:string;source:'category-native'|'catalog';count:number}>()
  for(const row of schemas.data||[]){const cfg=obj(row.configuration);for(const raw of [cfg.base_family,cfg.catalog_kind]){const key=safeFamilyKey(raw);if(!key)continue;const current=counts.get(key);counts.set(key,{label:key.replaceAll('_',' ').replaceAll('-',' '),source:'category-native',count:(current?.count||0)+1})}}
  for(const row of items.data||[]){const key=safeFamilyKey(row.sellable_type||row.kind);if(!key)continue;const current=counts.get(key);counts.set(key,{label:key.replaceAll('_',' ').replaceAll('-',' '),source:current?.source||'catalog',count:(current?.count||0)+1})}
  return[...counts.entries()].map(([key,value])=>({key,label:value.label.replace(/\b\w/g,c=>c.toUpperCase()),source:value.source,count:value.count})).sort((a,b)=>a.label.localeCompare(b.label,'fr'))
}

export async function listStudioTemplatePlacements(locale?:string):Promise<StudioTemplatePlacementOption[]>{
  const db=await createServiceClient();let query=db.from('angelcare_marketplace_homepage_placements').select('id,placement_key,status,locale,collection:angelcare_marketplace_homepage_collections(title),item:angelcare_marketplace_catalog_items(name_fr)').neq('status','archived').order('priority',{ascending:true}).order('sort_order',{ascending:true}).limit(300);if(locale&&['fr','en','ar'].includes(locale))query=query.eq('locale',locale);const{data,error}=await query;if(error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de charger les placements contextuels.',{cause:error});return(data||[]).map((row:any)=>({id:String(row.id),key:String(row.placement_key||row.id),label:String(row.placement_key||'Placement'),status:String(row.status||''),locale:String(row.locale||'fr'),collectionLabel:row.collection?.title?String(row.collection.title):null,itemLabel:row.item?.name_fr?String(row.item.name_fr):null}))
}
