import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { STUDIO_TEMPLATE_PRECEDENCE, type StudioResolvedTemplate, type StudioTemplateAssignment, type StudioTemplateAssignmentScope, type StudioTemplateResolutionCandidate } from './types'
import { assignmentFromContainer, parseStudioTemplateAssignment, familyConfigKey, placementConfigKey, STUDIO_TEMPLATE_DEFAULT_CONFIG_KEY } from './reference'
import { cachedTemplateResolution } from '@/angelcare-marketplace/studio-dependency-invalidation/public-cache'

type Row=Record<string,unknown>
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const text=(v:unknown)=>typeof v==='string'?v:''

async function configAssignment(key:string,scope:StudioTemplateAssignmentScope):Promise<StudioTemplateAssignment|null>{
  const db=await createServiceClient();const {data,error}=await db.from('angelcare_marketplace_configurations').select('value').eq('config_key',key).is('territory_id',null).is('tenant_id',null).is('locale',null).maybeSingle()
  if(error)return null
  return parseStudioTemplateAssignment(data?.value,scope)
}

async function publishedTemplate(templateId:string){
  const db=await createServiceClient();const {data,error}=await db.from('angelcare_marketplace_cms_templates').select('id,template_key,name,status,published_revision_id').eq('id',templateId).maybeSingle()
  if(error||!data)return{status:'TEMPLATE_MISSING' as const,row:null}
  if(String(data.status)!=='published'||!data.published_revision_id)return{status:'TEMPLATE_UNPUBLISHED' as const,row:data as Row}
  return{status:'VALID' as const,row:data as Row}
}

async function itemContext(input:{slug?:string;itemId?:string},locale:string){
  const db=await createServiceClient();
  let itemQuery=db.from('angelcare_marketplace_catalog_items').select('id,slug,kind,sellable_type,status,experience_config,experience_schema_key').eq('status','published')
  itemQuery=input.itemId?itemQuery.eq('id',input.itemId):itemQuery.eq('slug',String(input.slug||''))
  const itemResult=await itemQuery.maybeSingle()
  if(itemResult.error||!itemResult.data)return null
  const item=itemResult.data as Row
  const categoryLink=await db.from('angelcare_marketplace_catalog_item_categories').select('category_id,is_primary,sort_order').eq('catalog_item_id',text(item.id)).order('is_primary',{ascending:false}).order('sort_order',{ascending:true}).limit(1).maybeSingle()
  let category:Row|null=null
  if(categoryLink.data?.category_id){const result=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,experience_config,status,locale').eq('id',String(categoryLink.data.category_id)).in('status',['approved','published']).in('locale',[locale,'fr']).order('locale',{ascending:locale==='fr'}).limit(1).maybeSingle();category=(result.data||null) as Row|null}
  const schemaKey=text(item.experience_schema_key)||null
  let schema:Row|null=null
  if(schemaKey){const result=await db.from('angelcare_marketplace_experience_schemas').select('id,schema_key,configuration,status').eq('schema_key',schemaKey).eq('status','active').maybeSingle();schema=(result.data||null) as Row|null}
  return{item,category,schema}
}

function candidate(scope:StudioTemplateAssignmentScope,authority:string,assignment:StudioTemplateAssignment|null,status:StudioTemplateResolutionCandidate['status'],detail:string):StudioTemplateResolutionCandidate{return{scope,authority,assignment,status,detail}}

async function resolveStudioTemplateForCatalogItemUncached(input:{slug?:string;itemId?:string;locale:'fr'|'en'|'ar';collectionId?:string|null;placementId?:string|null}):Promise<StudioResolvedTemplate|null>{
  if(!input.slug&&!input.itemId)return null
  const context=await itemContext({slug:input.slug,itemId:input.itemId},input.locale);if(!context)return null
  const {item,category,schema}=context;const provenance:StudioTemplateResolutionCandidate[]=[]
  const family=text(item.sellable_type)||text(item.kind)||'catalog'
  let collection:Row|null=null
  if(input.collectionId){const db=await createServiceClient();const r=await db.from('angelcare_marketplace_homepage_collections').select('id,settings,status').eq('id',input.collectionId).in('status',['active','scheduled','approved']).maybeSingle();collection=(r.data||null) as Row|null}
  const assignments=new Map<StudioTemplateAssignmentScope,{authority:string;assignment:StudioTemplateAssignment|null}>([
    ['exact_item',{authority:'catalog_items.experience_config',assignment:assignmentFromContainer(item.experience_config,'exact_item')}],
    ['placement',{authority:'marketplace_configurations',assignment:input.placementId?await configAssignment(placementConfigKey(input.placementId),'placement'):null}],
    ['collection',{authority:'homepage_collections.settings',assignment:collection?assignmentFromContainer(collection.settings,'collection'):null}],
    ['experience_schema',{authority:'experience_schemas.configuration',assignment:schema?assignmentFromContainer(schema.configuration,'experience_schema'):null}],
    ['category',{authority:'catalog_categories.experience_config',assignment:category?assignmentFromContainer(category.experience_config,'category'):null}],
    ['family',{authority:'marketplace_configurations',assignment:await configAssignment(familyConfigKey(family),'family')}],
    ['marketplace_default',{authority:'marketplace_configurations',assignment:await configAssignment(STUDIO_TEMPLATE_DEFAULT_CONFIG_KEY,'marketplace_default')}],
  ])
  const expectedTarget=(scope:StudioTemplateAssignmentScope)=>scope==='exact_item'?text(item.id):scope==='collection'?(input.collectionId||''):scope==='experience_schema'?(schema?text(schema.id):''):scope==='category'?(category?text(category.id):''):''
  for(const scope of STUDIO_TEMPLATE_PRECEDENCE){
    const row=assignments.get(scope)!;const assignment=row.assignment
    if(!assignment||assignment.enabled===false){provenance.push(candidate(scope,row.authority,assignment,'MISS','Aucune assignation active.'));continue}
    const expected=expectedTarget(scope)
    if(expected&&assignment.target&&assignment.target.entityId!==expected){provenance.push(candidate(scope,row.authority,assignment,'TARGET_MISMATCH','La cible persistée ne correspond pas au contexte courant.'));continue}
    if(scope==='family'&&assignment.familyKey&&assignment.familyKey!==family){provenance.push(candidate(scope,row.authority,assignment,'TARGET_MISMATCH','La famille persistée ne correspond pas au produit/service.'));continue}
    if(scope==='placement'&&assignment.placementId&&assignment.placementId!==(input.placementId||'')){provenance.push(candidate(scope,row.authority,assignment,'TARGET_MISMATCH','Le placement persisté ne correspond pas au contexte courant.'));continue}
    const template=await publishedTemplate(assignment.template.entityId)
    if(template.status!=='VALID'){provenance.push(candidate(scope,row.authority,assignment,template.status,template.status==='TEMPLATE_MISSING'?'Template introuvable.':'Template non publié.'));continue}
    provenance.push(candidate(scope,row.authority,assignment,'VALID','Template publié résolu.'))
    return{status:'RESOLVED',assignment,templateId:String(template.row!.id),templateKey:text(template.row!.template_key),templateRevisionId:text(template.row!.published_revision_id),matchedScope:scope,provenance,item:{id:text(item.id),slug:text(item.slug),kind:text(item.kind),sellableType:text(item.sellable_type)||text(item.kind),schemaKey:schema?text(schema.schema_key):text(item.experience_schema_key)||null,categoryId:category?text(category.id):null,categoryKey:category?text(category.category_key):null}}
  }
  return{status:'FALLBACK_NATIVE',assignment:null,templateId:null,templateKey:null,templateRevisionId:null,matchedScope:null,provenance,item:{id:text(item.id),slug:text(item.slug),kind:text(item.kind),sellableType:text(item.sellable_type)||text(item.kind),schemaKey:schema?text(schema.schema_key):text(item.experience_schema_key)||null,categoryId:category?text(category.id):null,categoryKey:category?text(category.category_key):null}}
}

export async function resolveStudioTemplateForCatalogItem(input:{slug?:string;itemId?:string;locale:'fr'|'en'|'ar';collectionId?:string|null;placementId?:string|null}):Promise<StudioResolvedTemplate|null>{return cachedTemplateResolution({keyParts:[input],load:()=>resolveStudioTemplateForCatalogItemUncached(input)})}
