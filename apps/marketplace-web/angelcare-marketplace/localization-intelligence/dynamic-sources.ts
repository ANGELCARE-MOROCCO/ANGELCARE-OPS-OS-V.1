import type { DiscoveredCandidate } from './types'
import { sha256Node } from './scanner/node-hash'

type Audience='public'|'private'|'admin'
type JsonField={field:string;localeRoot?:string;include?:RegExp;exclude?:RegExp}
export type DynamicSourceDefinition={table:string;entityType:string;workspace:string;surface:string;route:string;sourceFields?:string[];jsonFields?:JsonField[];localeField?:string;identityFields?:string[];statusField?:string;audience?:Audience;sensitivity?:DiscoveredCandidate['sensitivity']}

/* Reviewed persisted authorities only. Customer-authored messages, evidence,
 * payment data and logs are intentionally excluded. */
export const DYNAMIC_SOURCE_DEFINITIONS:DynamicSourceDefinition[]=[
 {table:'angelcare_marketplace_catalog_items',entityType:'product_service',workspace:'products',surface:'catalog',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['name_fr','short_description_fr','description_fr'],jsonFields:[{field:'seo_metadata'},{field:'commercial_metadata'},{field:'experience_config'}]},
 {table:'angelcare_marketplace_catalog_item_media',entityType:'product_media',workspace:'products',surface:'product_media',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['alt_text_fr']},
 {table:'angelcare_marketplace_catalog_variants',entityType:'product_variant',workspace:'products',surface:'catalog',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['name_fr']},
 {table:'angelcare_marketplace_catalog_attribute_definitions',entityType:'catalog_attribute',workspace:'products',surface:'catalog_schema',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['name_fr']},
 {table:'angelcare_marketplace_catalog_categories',entityType:'category',workspace:'categories',surface:'category_gateway',route:'/angelcare-marketplace/fr/marketplace/category',sourceFields:['title','short_description'],jsonFields:[{field:'hero_content'},{field:'seo_metadata'},{field:'storefront_sections'}],localeField:'locale',identityFields:['category_key','territory_id']},
 {table:'angelcare_marketplace_homepage_campaigns',entityType:'homepage_campaign',workspace:'boutique',surface:'homepage_hero',route:'/angelcare-marketplace/fr',sourceFields:['eyebrow','title','subtitle','primary_cta_label','secondary_cta_label'],localeField:'locale',identityFields:['campaign_key','territory_id']},
 {table:'angelcare_marketplace_homepage_campaign_assets',entityType:'homepage_campaign_asset',workspace:'boutique',surface:'homepage_hero',route:'/angelcare-marketplace/fr',sourceFields:['alt_text_fr']},
 {table:'angelcare_marketplace_homepage_sections',entityType:'homepage_section',workspace:'boutique',surface:'homepage_sections',route:'/angelcare-marketplace/fr',sourceFields:['title','subtitle'],localeField:'locale',identityFields:['section_key','territory_id']},
 {table:'angelcare_marketplace_homepage_collections',entityType:'collection',workspace:'categories',surface:'homepage_collection',route:'/angelcare-marketplace/fr',sourceFields:['title','subtitle','description'],jsonFields:[{field:'settings'}],localeField:'locale',identityFields:['collection_key','territory_id']},
 {table:'angelcare_marketplace_homepage_placements',entityType:'homepage_placement',workspace:'boutique',surface:'homepage_placement',route:'/angelcare-marketplace/fr',sourceFields:['custom_title','custom_subtitle','cta_label'],localeField:'locale',identityFields:['placement_key','territory_id']},
 {table:'angelcare_marketplace_surface_sections',entityType:'storefront_surface_section',workspace:'boutique',surface:'surface_studio',route:'/angelcare-marketplace/fr',sourceFields:['eyebrow','title','body','primary_cta_label','secondary_cta_label'],jsonFields:[{field:'content'}],localeField:'locale',identityFields:['surface_id','section_key','territory_id']},
 {table:'angelcare_marketplace_media_assets',entityType:'media_asset',workspace:'boutique',surface:'media_library',route:'/angelcare-marketplace/fr',sourceFields:['alt_text_fr','title_fr','caption_fr']},
 {table:'angelcare_marketplace_cms_pages',entityType:'cms_page',workspace:'boutique',surface:'public_page',route:'/angelcare-marketplace/fr',sourceFields:['title','navigation_label','description','seo_title','seo_description'],localeField:'locale',identityFields:['route_key','territory_id']},
 {table:'angelcare_marketplace_cms_blocks',entityType:'cms_block',workspace:'boutique',surface:'page_builder',route:'/angelcare-marketplace/fr',jsonFields:[{field:'content'},{field:'settings'}],localeField:'locale',identityFields:['page_id','block_key']},
 {table:'angelcare_marketplace_cms_menus',entityType:'navigation_menu',workspace:'boutique',surface:'navigation',route:'/angelcare-marketplace/fr',sourceFields:['name'],localeField:'locale',identityFields:['menu_key','territory_id']},
 {table:'angelcare_marketplace_cms_ctas',entityType:'cms_cta',workspace:'boutique',surface:'public_cta',route:'/angelcare-marketplace/fr',sourceFields:['label'],localeField:'locale',identityFields:['cta_key','territory_id']},
 {table:'angelcare_marketplace_seo_metadata',entityType:'seo_metadata',workspace:'boutique',surface:'seo',route:'/angelcare-marketplace/fr',sourceFields:['title','description','open_graph_title','open_graph_description'],localeField:'locale',identityFields:['route','territory_id']},
 {table:'angelcare_marketplace_promotions',entityType:'promotion',workspace:'marketing',surface:'promotion',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['name','description'],jsonFields:[{field:'content'}]},
 {table:'angelcare_marketplace_merchandising_rules',entityType:'merchandising_rule',workspace:'marketing',surface:'merchandising',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['name'],localeField:'locale',identityFields:['rule_key','territory_id']},
 {table:'angelcare_marketplace_search_rules',entityType:'search_rule',workspace:'marketing',surface:'search_discovery',route:'/angelcare-marketplace/fr/marketplace/search',jsonFields:[{field:'content'}],localeField:'locale'},
 {table:'angelcare_marketplace_live_experience_campaigns',entityType:'live_experience',workspace:'marketing',surface:'live_experience',route:'/angelcare-marketplace/fr',sourceFields:['name'],jsonFields:[{field:'localized_content',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_live_experience_purposes',entityType:'live_experience_purpose',workspace:'marketing',surface:'live_experience',route:'/angelcare-marketplace/fr',jsonFields:[{field:'name',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_live_experience_themes',entityType:'live_experience_theme',workspace:'marketing',surface:'live_experience',route:'/angelcare-marketplace/fr',jsonFields:[{field:'name',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_live_experience_presets',entityType:'live_experience_preset',workspace:'marketing',surface:'live_experience',route:'/angelcare-marketplace/fr',jsonFields:[{field:'name',localeRoot:'fr'},{field:'configuration'}]},
 {table:'angelcare_marketplace_academy_programs',entityType:'academy_program',workspace:'academy',surface:'academy_public',route:'/angelcare-marketplace/fr/academy',sourceFields:['title_fr','description_fr']},
 {table:'angelcare_marketplace_academy_courses',entityType:'academy_course',workspace:'academy',surface:'academy_public',route:'/angelcare-marketplace/fr/academy/programs',sourceFields:['title_fr','description_fr']},
 {table:'angelcare_marketplace_academy_course_modules',entityType:'academy_module',workspace:'academy',surface:'academy_public',route:'/angelcare-marketplace/fr/academy/programs',sourceFields:['title_fr']},
 {table:'angelcare_marketplace_academy_competencies',entityType:'academy_competency',workspace:'academy',surface:'academy_public',route:'/angelcare-marketplace/fr/academy',sourceFields:['title_fr','description_fr']},
 {table:'angelcare_marketplace_academy_sessions',entityType:'academy_session',workspace:'academy',surface:'academy_public',route:'/angelcare-marketplace/fr/academy',sourceFields:['title_fr']},
 {table:'angelcare_marketplace_academy_assessments',entityType:'academy_assessment',workspace:'academy',surface:'academy_public',route:'/angelcare-marketplace/fr/academy',sourceFields:['title_fr']},
 {table:'angelcare_marketplace_partner_plans',entityType:'b2b_plan',workspace:'b2b',surface:'partner_plan',route:'/angelcare-marketplace/fr/b2b',sourceFields:['name_fr','description_fr']},
 {table:'angelcare_marketplace_b2b_program_services',entityType:'b2b_program_service',workspace:'b2b',surface:'partner_program',route:'/angelcare-marketplace/fr/b2b',sourceFields:['name_fr']},
 {table:'angelcare_marketplace_b2b_diagnostic_sections',entityType:'b2b_diagnostic_section',workspace:'b2b',surface:'diagnostic',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr'],audience:'private'},
 {table:'angelcare_marketplace_b2b_recommendations',entityType:'b2b_recommendation',workspace:'b2b',surface:'recommendation',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr','rationale_fr'],audience:'private'},
 {table:'angelcare_marketplace_b2b_readiness_checks',entityType:'b2b_readiness_check',workspace:'b2b',surface:'readiness',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr'],audience:'private'},
 {table:'angelcare_marketplace_trust_badge_definitions',entityType:'trust_badge',workspace:'trust',surface:'public_trust',route:'/angelcare-marketplace/fr/trust',sourceFields:['name_fr','description_fr'],jsonFields:[{field:'public_wording',localeRoot:'fr'}],sensitivity:'trust'},
 {table:'angelcare_marketplace_trust_standards',entityType:'trust_standard',workspace:'trust',surface:'standards',route:'/angelcare-marketplace/fr/trust',sourceFields:['title_fr'],audience:'private',sensitivity:'trust'},
 {table:'angelcare_marketplace_trust_sops',entityType:'trust_sop',workspace:'trust',surface:'sop',route:'/angelcare-marketplace/fr/trust',sourceFields:['title_fr'],audience:'private',sensitivity:'trust'},
 {table:'angelcare_marketplace_experience_schemas',entityType:'experience_schema',workspace:'categories',surface:'schema_studio',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['name_fr','description_fr']},
 {table:'angelcare_marketplace_experience_schema_fields',entityType:'experience_schema_field',workspace:'categories',surface:'schema_studio',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['label_fr','help_fr']},
 {table:'angelcare_marketplace_experience_variant_groups',entityType:'experience_variant_group',workspace:'categories',surface:'schema_studio',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['label_fr']},
 {table:'angelcare_marketplace_experience_attribute_groups',entityType:'experience_attribute_group',workspace:'categories',surface:'schema_studio',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['label_fr']},
 {table:'angelcare_marketplace_wallet_policies',entityType:'wallet_policy',workspace:'finance',surface:'wallet',route:'/angelcare-marketplace/fr/account/wallet',sourceFields:['name_fr','description_fr'],audience:'private'},
 {table:'angelcare_marketplace_wallet_tiers',entityType:'wallet_tier',workspace:'finance',surface:'wallet',route:'/angelcare-marketplace/fr/account/wallet',sourceFields:['name_fr'],audience:'private'},
 {table:'angelcare_marketplace_footer_profiles',entityType:'footer_profile',workspace:'boutique',surface:'footer',route:'/angelcare-marketplace/fr',jsonFields:[{field:'name',localeRoot:'fr'},{field:'description',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_footer_sections',entityType:'footer_section',workspace:'boutique',surface:'footer',route:'/angelcare-marketplace/fr',jsonFields:[{field:'title',localeRoot:'fr'},{field:'description',localeRoot:'fr'},{field:'eyebrow',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_footer_links',entityType:'footer_link',workspace:'boutique',surface:'footer',route:'/angelcare-marketplace/fr',jsonFields:[{field:'label',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_footer_contact_desks',entityType:'footer_contact',workspace:'boutique',surface:'footer',route:'/angelcare-marketplace/fr',jsonFields:[{field:'label',localeRoot:'fr'},{field:'description',localeRoot:'fr'},{field:'response_commitment',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_homepage_block_definitions',entityType:'homepage_block_definition',workspace:'boutique',surface:'homepage_studio',route:'/angelcare-marketplace/fr',sourceFields:['name_fr']},
 {table:'angelcare_marketplace_frontend_surfaces',entityType:'frontend_surface',workspace:'boutique',surface:'surface_studio',route:'/angelcare-marketplace/fr',sourceFields:['title'],jsonFields:[{field:'content',localeRoot:'fr'}]},
 {table:'angelcare_marketplace_conversion_policies',entityType:'conversion_policy',workspace:'orders',surface:'checkout',route:'/angelcare-marketplace/fr/marketplace',sourceFields:['name_fr','description_fr']},
 {table:'angelcare_marketplace_journey_policies',entityType:'journey_policy',workspace:'operations',surface:'journey',route:'/angelcare-marketplace/fr/account',sourceFields:['name_fr','description_fr'],audience:'private'},
 {table:'angelcare_marketplace_development_categories',entityType:'development_category',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['name_fr','description_fr']},
 {table:'angelcare_marketplace_development_dimensions',entityType:'development_dimension',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['name_fr','description_fr']},
 {table:'angelcare_marketplace_development_activities',entityType:'development_activity',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['title_fr','objective_fr','safety_notes_fr','contraindications_fr'],sensitivity:'child_safety'},
 {table:'angelcare_marketplace_development_activity_steps',entityType:'development_activity_step',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['instruction_fr'],sensitivity:'child_safety'},
 {table:'angelcare_marketplace_development_guides',entityType:'development_guide',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['title_fr','content_fr'],sensitivity:'child_safety'},
 {table:'angelcare_marketplace_development_kits',entityType:'development_kit',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['name_fr','description_fr']},
 {table:'angelcare_marketplace_development_kit_items',entityType:'development_kit_item',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['item_name_fr']},
 {table:'angelcare_marketplace_development_alternatives',entityType:'development_alternative',workspace:'products',surface:'development_public',route:'/angelcare-marketplace/fr/development',sourceFields:['alternative_label_fr','reason_fr']},
 {table:'angelcare_marketplace_development_supplier_specs',entityType:'development_supplier_spec',workspace:'providers',surface:'supplier_specification',route:'/angelcare-marketplace/admin/providers',sourceFields:['title_fr'],audience:'admin'},
 {table:'angelcare_marketplace_health_referral_protocols',entityType:'health_referral_protocol',workspace:'b2b',surface:'health_partner',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr'],audience:'private',sensitivity:'medical_boundary'},
 {table:'angelcare_marketplace_health_support_boundaries',entityType:'health_support_boundary',workspace:'b2b',surface:'health_partner',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr'],audience:'private',sensitivity:'medical_boundary'},
 {table:'angelcare_marketplace_hospitality_guest_service_rules',entityType:'hospitality_service_rule',workspace:'b2b',surface:'hospitality',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr'],audience:'private'},
 {table:'angelcare_marketplace_hospitality_seasons',entityType:'hospitality_season',workspace:'b2b',surface:'hospitality',route:'/angelcare-marketplace/fr/b2b',sourceFields:['name_fr'],audience:'private'},
 {table:'angelcare_marketplace_establishment_academy_needs',entityType:'establishment_academy_need',workspace:'b2b',surface:'establishment',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr'],audience:'private'},
 {table:'angelcare_marketplace_partner_onboarding_checks',entityType:'partner_onboarding_check',workspace:'b2b',surface:'partner_os',route:'/angelcare-marketplace/fr/b2b',sourceFields:['title_fr','description_fr'],audience:'private'},
 {table:'angelcare_marketplace_trust_policies',entityType:'trust_policy',workspace:'trust',surface:'compliance',route:'/angelcare-marketplace/fr/trust',sourceFields:['title_fr'],audience:'private',sensitivity:'trust'},
 {table:'angelcare_marketplace_trust_controls',entityType:'trust_control',workspace:'trust',surface:'compliance',route:'/angelcare-marketplace/fr/trust',sourceFields:['title_fr'],audience:'private',sensitivity:'trust'},
 {table:'angelcare_marketplace_trust_sop_versions',entityType:'trust_sop_version',workspace:'trust',surface:'sop',route:'/angelcare-marketplace/fr/trust',sourceFields:['content_fr'],audience:'private',sensitivity:'trust'},
 {table:'angelcare_marketplace_quality_frameworks',entityType:'quality_framework',workspace:'trust',surface:'quality',route:'/angelcare-marketplace/fr/trust',sourceFields:['name_fr'],audience:'private',sensitivity:'trust'},
 {table:'angelcare_marketplace_quality_assessment_criteria',entityType:'quality_criterion',workspace:'trust',surface:'quality',route:'/angelcare-marketplace/fr/trust',sourceFields:['title_fr','description_fr'],audience:'private',sensitivity:'trust'},
 {table:'angelcare_marketplace_analytics_metric_definitions',entityType:'analytics_metric',workspace:'analytics',surface:'metric_registry',route:'/angelcare-marketplace/admin/analytics',sourceFields:['name_fr','description_fr'],audience:'admin'},
 {table:'angelcare_marketplace_metric_definitions',entityType:'executive_metric',workspace:'analytics',surface:'metric_registry',route:'/angelcare-marketplace/admin/analytics',sourceFields:['name_fr','description_fr'],audience:'admin'},
 {table:'angelcare_marketplace_operations_checklist_templates',entityType:'operations_checklist',workspace:'operations',surface:'mission',route:'/angelcare-marketplace/admin/operations',sourceFields:['title_fr'],audience:'admin'},
 {table:'angelcare_marketplace_operations_checklist_items',entityType:'operations_checklist_item',workspace:'operations',surface:'mission',route:'/angelcare-marketplace/admin/operations',sourceFields:['title_fr','instructions_fr'],audience:'admin'},
 {table:'angelcare_marketplace_qa_test_suites',entityType:'qa_test_suite',workspace:'governance',surface:'qa',route:'/angelcare-marketplace/admin/quality-assurance',sourceFields:['name_fr'],audience:'admin'},
 {table:'angelcare_marketplace_qa_test_cases',entityType:'qa_test_case',workspace:'governance',surface:'qa',route:'/angelcare-marketplace/admin/quality-assurance',sourceFields:['title_fr'],audience:'admin'},
 {table:'angelcare_marketplace_security_controls',entityType:'security_control',workspace:'governance',surface:'security',route:'/angelcare-marketplace/admin/security',sourceFields:['name_fr','description_fr'],audience:'admin',sensitivity:'trust'},
 {table:'angelcare_marketplace_launch_gates',entityType:'launch_gate',workspace:'governance',surface:'launch',route:'/angelcare-marketplace/admin/launch',sourceFields:['name_fr','description_fr'],audience:'admin'},
 {table:'angelcare_marketplace_activation_checks',entityType:'activation_check',workspace:'governance',surface:'activation',route:'/angelcare-marketplace/admin/launch',sourceFields:['label_fr'],audience:'admin'},
 {table:'angelcare_marketplace_schema_csv_templates',entityType:'schema_csv_template',workspace:'categories',surface:'import',route:'/angelcare-marketplace/admin/catalog/categories',sourceFields:['instructions_fr'],audience:'admin'},
 {table:'angelcare_marketplace_commission_rules',entityType:'commission_rule',workspace:'finance',surface:'commissions',route:'/angelcare-marketplace/admin/finance',sourceFields:['name_fr'],audience:'admin'},
]

export const CUSTOM_DYNAMIC_SOURCE_AUTHORITIES=['angelcare_marketplace_cms_menu_items'] as const

type Row=Record<string,unknown>
type QueryResult={data:unknown;error:{message?:string}|null}
type Query=PromiseLike<QueryResult>&{eq:(field:string,value:string)=>Query;in:(field:string,values:string[])=>Query;limit:(limit:number)=>Query}
type DynamicDb={from:(table:string)=>unknown}
function select(db:DynamicDb,table:string,columns:string){return(db.from(table)as{select:(selection:string)=>Query}).select(columns)}
const text=(value:unknown)=>typeof value==='string'?value.trim():''
const technicalJsonKey=/^(id|key|uuid|url|href|route|slug|type|status|locale|currency|amount|price|priority|order|sort|width|height|size|count|enabled|active|variant|media_id|asset_id|entity_id|target_id)$/i
const humanJsonKey=/(title|label|name|headline|eyebrow|subtitle|description|body|text|copy|caption|alt|cta|message|content|summary|wording|tooltip|help|placeholder)/i

function jsonLeaves(value:unknown,path:string[]=[]):Array<{path:string[];text:string}>{
 if(typeof value==='string'){const normalized=value.trim();return normalized&&humanJsonKey.test(path.at(-1)||'')?[{path,text:normalized}]:[]}
 if(Array.isArray(value))return value.flatMap((item,index)=>{const record=item&&typeof item==='object'?item as Row:null,semantic=record&&['key','id','code','block_key','section_key','item_key'].map(key=>record[key]).find(candidate=>typeof candidate==='string');return jsonLeaves(item,[...path,semantic?`item:${semantic}`:`item:${index}`])})
 if(value&&typeof value==='object')return Object.entries(value as Row).flatMap(([key,item])=>technicalJsonKey.test(key)?[]:jsonLeaves(item,[...path,key]))
 return[]
}
function identity(row:Row,definition:DynamicSourceDefinition){return(definition.identityFields||['id']).map(field=>text(row[field])).filter(Boolean).join('.')}
function makeCandidate(definition:DynamicSourceDefinition,entityId:string,sourceRowId:string,field:string,sourceTextFr:string):DiscoveredCandidate{
 const stableKey=`entity.${definition.entityType}.${entityId}.${field}`
 return{stableKey,sourceTextFr,sourceHash:sha256Node(sourceTextFr),sourceType:'database_registry',sourceAdapter:'database_registry',databaseSchema:'public',databaseTable:definition.table,databaseRowId:sourceRowId,databaseField:field,route:definition.route,domain:definition.workspace,workflow:definition.surface,audience:definition.audience||'public',contentType:'dynamic_entity_field',sensitivity:definition.sensitivity||'ordinary',contextDescription:`${definition.workspace} · ${definition.surface} · ${definition.entityType}.${field}`,variables:[...sourceTextFr.matchAll(/\{\{?\s*[\w.-]+\s*\}?\}/g)].map(match=>match[0]),supportsHtml:/<\w[\s>]/.test(sourceTextFr),directionalityRisk:false,classification:'translatable',confidence:1,discoveryEvidence:{workspace:definition.workspace,surface:definition.surface,entityType:definition.entityType,entityIdentity:entityId,identityFields:definition.identityFields||['id'],fieldName:field,localeAuthority:definition.localeField?'locale_row':'localized_columns'}}
}
export async function scanDynamicSources(db:DynamicDb):Promise<{candidates:DiscoveredCandidate[];failures:Array<{adapter:string;source:string;message:string}>}>{
 const candidates:DiscoveredCandidate[]=[],failures:Array<{adapter:string;source:string;message:string}>=[]
 async function scanDefinition(definition:DynamicSourceDefinition){
  const fields=[...(definition.sourceFields||[]),...(definition.jsonFields||[]).map(item=>item.field)]
  const columns=['id',...(definition.identityFields||[]),definition.statusField,...fields,definition.localeField].filter(Boolean).filter((field,index,all)=>all.indexOf(field)===index).join(',')
  const query=select(db,definition.table,columns),result=definition.localeField?await query.eq(definition.localeField,'fr').limit(5000):await query.limit(5000)
  if(result.error){failures.push({adapter:'database_registry',source:definition.table,message:result.error.message||'Lecture impossible'});return}
  for(const row of(Array.isArray(result.data)?result.data:[])as Row[]){const entityId=identity(row,definition),sourceRowId=text(row.id);if(!entityId||!sourceRowId)continue
   for(const field of definition.sourceFields||[]){const source=text(row[field]);if(source)candidates.push(makeCandidate(definition,entityId,sourceRowId,field,source))}
   for(const jsonField of definition.jsonFields||[]){const root=jsonField.localeRoot&&row[jsonField.field]&&typeof row[jsonField.field]==='object'?(row[jsonField.field]as Row)[jsonField.localeRoot]:row[jsonField.field];for(const leaf of jsonLeaves(root)){const path=[jsonField.localeRoot,...leaf.path].filter(Boolean).join('.');if((jsonField.include&&!jsonField.include.test(path))||jsonField.exclude?.test(path))continue;candidates.push(makeCandidate(definition,entityId,sourceRowId,`${jsonField.field}.${path}`,leaf.text))}}
  }
 }
 for(let index=0;index<DYNAMIC_SOURCE_DEFINITIONS.length;index+=12)await Promise.all(DYNAMIC_SOURCE_DEFINITIONS.slice(index,index+12).map(scanDefinition))
 try{
  const{data:menus,error:menuError}=await select(db,'angelcare_marketplace_cms_menus','id').eq('locale','fr').limit(5000);if(menuError)throw new Error(menuError.message||'Menus FR illisibles');const menuIds=(Array.isArray(menus)?menus:[]).map(row=>text((row as Row).id)).filter(Boolean)
  if(menuIds.length){const{data:items,error:itemError}=await select(db,'angelcare_marketplace_cms_menu_items','id,label').in('menu_id',menuIds).limit(5000);if(itemError)throw new Error(itemError.message||'Items de navigation illisibles');const definition:DynamicSourceDefinition={table:'angelcare_marketplace_cms_menu_items',entityType:'navigation_item',workspace:'boutique',surface:'navigation',route:'/angelcare-marketplace/fr',sourceFields:['label']};for(const row of(Array.isArray(items)?items:[])as Row[]){const entityId=text(row.id),source=text(row.label);if(entityId&&source)candidates.push(makeCandidate(definition,entityId,entityId,'label',source))}}
 }catch(error){failures.push({adapter:'database_registry',source:'angelcare_marketplace_cms_menu_items',message:error instanceof Error?error.message:'Lecture impossible'})}
 return{candidates,failures}
}
