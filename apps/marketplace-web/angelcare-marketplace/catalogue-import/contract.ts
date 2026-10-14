import {isDoctrineProfile} from './doctrine-profiles'
import type { ExperienceFieldBlueprint, ExperienceSchemaBlueprint } from '../category-native/types'
import { categoryNativeCsvFields } from '../category-native/product360-enrichment'
import { normalizeCategoryNativeField, parseCategoryNativeCsv } from '../category-native/validation'
import { PRODUCT_360_IMPORT_FIELDS, product360CanonicalDestination } from '../enterprise-command/product-360-contract'
import { requireProductDoctrine } from '../enterprise-command/product-doctrine'
import { csv, present, text, type Row } from '../catalogue-population/model'


const destinationAliases:Record<string,string>={
 seo_canonical_url:'seo_metadata.canonical',trust_headline:'trust_config.trust_headline',trust_proof_urls:'trust_config.proof_urls',
 sourcing_preferred_provider_refs:'fulfillment_config.preferred_provider_ids',sourcing_preferred_vendor_refs:'fulfillment_config.preferred_vendor_ids',sourcing_required_capabilities:'fulfillment_config.required_capabilities',sourcing_assignment_strategy:'fulfillment_config.assignment_strategy',sourcing_notes:'fulfillment_config.sourcing_notes',
 territory_message:'territory_config.territory_message',fulfillment_notes:'fulfillment_config.fulfillment_notes',
 relation_cross_sell_refs:'relation_config.cross_sell_ids',relation_upsell_refs:'relation_config.upsell_ids',relation_alternative_refs:'relation_config.alternative_ids',relation_bundle_refs:'relation_config.bundle_ids',relation_message:'relation_config.relation_message'
}
export function canonicalDestination(key:string,doctrine:ReturnType<typeof requireProductDoctrine>){return destinationAliases[key]?'catalog_items.'+destinationAliases[key]:product360CanonicalDestination(key,doctrine)}
export function originalFieldValue(before:Row|null,field:ImportField):unknown{
 if(!before)return null
 if(Object.hasOwn(before.experience_configuration||{},field.field_key))return before.experience_configuration[field.field_key]
 const parts=field.destination.split('.')
 if(parts[0]==='catalog_items'&&parts.length<=3)return parts.length===2?before[parts[1]]??null:before[parts[1]]?.[parts[2]]??null
 const map:Record<string,string>={catalog_variants:'variants',catalog_item_media:'media',catalog_item_categories:'categories',catalog_availability:'availability',finance_price_rules:'priceRules',homepage_placements:'placements'}
 return before[map[field.destination]]??null
}

export const CONTRACT = 'ANGELCARE_CATALOGUE_IMPORT_R2'
export const TASKS = {
  create: { label: 'Créer des offres', description: 'Un dossier natif adapté à ce schéma, enregistré en brouillon.' },
  update: { label: 'Mettre à jour des offres', description: 'Changements explicites ; les cellules vides conservent les valeurs existantes.' },
  translations: { label: 'Compléter les traductions', description: 'Noms, descriptions et SEO des langues choisies, sans toucher aux autres réglages.' },
  media: { label: 'Associer des médias', description: 'Galerie, variantes et trois placements éditoriaux ; correspondances exactes et revue visuelle.' },
  relations: { label: 'Recommandations & catégories', description: 'Relations natives et appartenance aux catégories, sans changer de schéma.' },
  pricing: { label: 'Tarifs & règles Finance', description: 'Montants, unités et règles natives ; publication contrôlée séparément.' },
  availability: { label: 'Disponibilité & couverture', description: 'Stock, capacité, territoires et périodes, selon l’autorité de ce schéma.' },
  dossier: { label: 'Enrichir un dossier', description: 'Sélectionner précisément les chapitres et collections à compléter.' },
} as const
export type ImportTask = keyof typeof TASKS
export type ImportTarget = { task: ImportTask; schemaKey: string; categoryKeys: string[]; locales: string[]; modules: string[]; categoryMode: 'add'|'remove'|'replace'; relationMode: 'add'|'remove'|'replace'; collectionMode: 'merge'|'replace'; templateDepth:'essential'|'complete' }
export type ImportField = ExperienceFieldBlueprint & { destination: string; module: string; draftRequired: boolean; publishRequired: boolean; conditional_rule?: Row; unit: string; example: string }
export type ImportProfile = { key: string; version: number; identity: string; title: string; sellable: string; native: boolean; availability: string; journey: string; handover: string; fields: ImportField[]; modules: string[]; blockers: string[]; schema: ExperienceSchemaBlueprint }
export type CellIssue = { row: number; key: string; value: unknown; expected: string; message: string; severity: 'error'|'warning' }
export type PreparedRow = { number: number; identity: string; original: Row; values: Row; clears: string[]; issues: CellIssue[]; complete: boolean }
export const MANAGED_HEADERS = ['_import_contract','_profile_fingerprint','_operation','template_version','schema_key']
const structuredArrays = new Set(['variants_json','media_json','availability_json','price_rules_json','components','kit_contents'])
const supportedTypes = new Set(['text','textarea','richtext','number','integer','money','boolean','select','multiselect','list','date','datetime','time','time_ranges','territory_list','media','media_list','component_list','json'])
export const MODULE_LABELS: Record<string,string> = { identity:'Identité',content:'Contenu FR · EN · AR',pricing:'Tarifs & Finance',availability:'Capacité & disponibilité',media:'Images & médias',categories:'Catégories natives',variants:'Variantes',commercial:'Présentation commerciale',operations:'Paramètres métier',trust:'Confiance & limites',territory:'Couverture',fulfillment:'Réalisation & suivi',sourcing:'Prestataires & sources',relations:'Offres liées',merchandising:'Mise en avant',seo:'Référencement',discovery:'Découverte & filtres',presentation:'Présentation & conseils',governance:'Notes opérateur' }
const moduleFor = (field: ExperienceFieldBlueprint): string => field.section_key.replace(/^product_360_/, '').replace(/^product_360$/, 'fulfillment').replace(/^doctrine$/, 'operations')
export function defaultTarget(schemaKey = '', task: ImportTask = 'create'): ImportTarget { return { schemaKey,task,categoryKeys:[],locales:['fr','en','ar'],modules:[],categoryMode:'add',relationMode:'add',collectionMode:'merge',templateDepth:'essential' } }
export function normalizeTarget(source: Row): ImportTarget {
  if (!(text(source.task) in TASKS)) throw Error('Choisissez une tâche d’import.')
  const base = defaultTarget(text(source.schemaKey), source.task)
  base.categoryKeys = [...new Set(Array.isArray(source.categoryKeys) ? source.categoryKeys.map(text).filter(Boolean) : [])]
  base.locales = [...new Set(Array.isArray(source.locales) ? source.locales.filter((v: string) => ['fr','en','ar'].includes(v)) : base.locales)]
  if (!base.locales.length) throw Error('Sélectionnez au moins une langue.')
  base.modules = [...new Set(Array.isArray(source.modules) ? source.modules.map(text).filter(Boolean) : [])]
  for (const key of ['categoryMode','relationMode'] as const) { if (source[key] && !['add','remove','replace'].includes(source[key])) throw Error('Intention de liaison invalide.'); base[key] = source[key] || 'add' }
  if (source.collectionMode && !['merge','replace'].includes(source.collectionMode)) throw Error('Intention de collection invalide.')
  base.collectionMode = source.collectionMode || 'merge'
  if(source.templateDepth&&!['essential','complete'].includes(source.templateDepth))throw Error('Profondeur de template invalide.')
  base.templateDepth=source.templateDepth||'essential'
  return base
}
function conditionSupported(rule: unknown): boolean {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return !rule
  const r = rule as Row
  if (!Object.keys(r).length) return true
  if (r.all || r.any) return Object.keys(r).length===1 && Array.isArray(r.all || r.any) && (r.all || r.any).every(conditionSupported)
  return typeof r.field==='string' && ['equals','not_equals','in','not_in','present','absent','true','false','gt','gte','lt','lte'].includes(r.operator || r.op || 'equals') && Object.keys(r).every(k => ['field','operator','op','value'].includes(k))
}
export function conditionResolved(rule:Row|undefined,values:Row):boolean{if(!rule||!Object.keys(rule).length)return true;if(rule.all||rule.any)return(rule.all||rule.any).every((r:Row)=>conditionResolved(r,values));return Object.hasOwn(values,rule.field)}
export function applies(rule: Row|undefined, values: Row): boolean {
  if (!rule || !Object.keys(rule).length) return true
  if (rule.all) return rule.all.every((r: Row) => applies(r,values))
  if (rule.any) return rule.any.some((r: Row) => applies(r,values))
  const value=values[rule.field], operator=rule.operator || rule.op || 'equals'
  switch(operator){case'present':return present(value);case'absent':return !present(value);case'true':return value===true||value==='true';case'false':return value===false||value==='false';case'equals':return String(value)===String(rule.value);case'not_equals':return String(value)!==String(rule.value);case'in':return Array.isArray(rule.value)&&rule.value.some((v:unknown)=>String(v)===String(value));case'not_in':return Array.isArray(rule.value)&&!rule.value.some((v:unknown)=>String(v)===String(value));case'gt':return Number(value)>Number(rule.value);case'gte':return Number(value)>=Number(rule.value);case'lt':return Number(value)<Number(rule.value);case'lte':return Number(value)<=Number(rule.value);default:return false}
}
function fieldExample(f: ExperienceFieldBlueprint): string {
  if (structuredArrays.has(f.field_key) || ['component_list','time_ranges'].includes(f.field_type)) return f.field_type==='time_ranges'?'[{"start":"09:00","end":"18:00"}]':'[]'
  if (f.field_type==='json') return '{}'
  if (f.allowed_values.length) return f.allowed_values[0]
  if (f.field_type==='integer') return String(Math.max(1,Number(f.validation.min)||1))
  if (['money','number'].includes(f.field_type)) return String(Math.max(1,Number(f.validation.min)||1))
  if (f.field_type==='boolean') return 'true'
  if (f.field_type==='date') return '2027-01-15'
  if (f.field_type==='datetime') return '2027-01-15T09:00:00Z'
  if (f.field_type==='time') return '09:00'
  if (f.field_key.endsWith('_ar')) return 'مثال توضيحي — استبدله بمحتواك'
  if (f.field_key.endsWith('_en')) return 'Illustrative example — replace with your content'
  return 'Exemple à remplacer'
}
export function compileProfile(schema: ExperienceSchemaBlueprint): ImportProfile {
  const doctrine = requireProductDoctrine(text(schema.configuration.sellable_type)), identity=text(schema.configuration.identity_field)
  const blockers: string[] = []
  if (schema.status!=='active') blockers.push('Le schéma doit être actif.')
  if (!identity) blockers.push('Le schéma ne déclare pas de clé d’identité.')
  const fields = categoryNativeCsvFields(schema).filter(f=>!f.field_key.startsWith('_') && !['status','kind','sellable_type'].includes(f.field_key) && (f.field_key!=='item_key'||identity==='item_key')).map((field): ImportField => {
    const native = schema.fields.find(f=>f.field_key===field.field_key) as (ExperienceFieldBlueprint & {conditional_rule?:Row})|undefined
    const canonical=PRODUCT_360_IMPORT_FIELDS.find(f=>f.key===field.field_key)
    for(const key of Object.keys(field.validation))if(!['min','max','pattern','max_length','maxLength','min_length','minLength','unit','json_shape'].includes(key))blockers.push(`${field.field_key} : validation non prise en charge (${key}).`)
    if (!supportedTypes.has(field.field_type)) blockers.push(`${field.field_key} : type de contrôle non pris en charge (${field.field_type}).`)
    if (!conditionSupported(native?.conditional_rule)) blockers.push(`${field.field_key} : condition non prise en charge ; activation bloquée.`)
    if (field.validation.pattern) { try { new RegExp(String(field.validation.pattern)) } catch { blockers.push(`${field.field_key} : expression de validation invalide.`) } }
    const destination=field.field_key===identity?'catalog_items.item_key':canonical?canonicalDestination(canonical.key,doctrine):`catalog_items.experience_configuration.${field.field_key}`
    return {...field,validation:{...field.validation,...(structuredArrays.has(field.field_key)?{json_shape:'array'}:{})},destination,module:canonical?canonical.group:moduleFor(field),conditional_rule:native?.conditional_rule,draftRequired:field.field_key===identity||field.field_key==='name_fr',publishRequired:field.required||!!canonical?.publishRequired,unit:text(field.validation.unit)||(/_dh$|price_amount/.test(field.field_key)?'Dh':/_minutes$/.test(field.field_key)?'minutes':/_hours$/.test(field.field_key)?'heures':/_km$/.test(field.field_key)?'km':''),example:fieldExample(field)}
  })
  if (!fields.some(f=>f.field_key===identity)) blockers.push('L’identité doit être exposée dans le contrat CSV actif.')
  return {native:!isDoctrineProfile(schema),key:schema.schema_key,version:schema.version,title:schema.name_fr,identity,sellable:doctrine.key,availability:schema.availability_authority,journey:schema.conversion_template,handover:schema.operations_handover_type,fields,modules:[...new Set(fields.map(f=>f.module))],blockers,schema}
}
export function targetFields(profile: ImportProfile,target: ImportTarget): ImportField[] {
  if (target.schemaKey!==profile.key) throw Error('Le schéma du fichier doit correspondre à la cible.')
  const keep: Partial<Record<ImportTask,string[]>> = {translations:['content','seo'],media:['media','variants'],relations:['categories','relations'],pricing:['pricing'],availability:['availability','territory']}
  const modules=target.task==='dossier'?target.modules:keep[target.task]
  const core=new Set(['item_key','slug','sku','name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar','description_fr','description_en','description_ar','price_mode','price_amount','currency_label','category_keys','primary_category_key','territory_codes','availability_status','availability_capacity','primary_image_reference','gallery_references','media_json','variants_json'])
  const native=new Set(profile.native?profile.schema.fields.filter(f=>f.csv_enabled).map(f=>f.field_key):requireProductDoctrine(profile.sellable).fields.map(f=>f.key))
  return profile.fields.filter(f=>f.field_key===profile.identity || ((!modules || modules.includes(f.module)) && (!['create','update'].includes(target.task)||target.templateDepth==='complete'||native.has(f.field_key)||core.has(f.field_key)) && (!/(?:_fr|_en|_ar)$/.test(f.field_key)||target.locales.includes(f.field_key.slice(-2)))))
}
export function stable(value: unknown): string { if (Array.isArray(value)) return '['+value.map(stable).join(',')+']'; if(value&&typeof value==='object') return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>JSON.stringify(k)+':'+stable(v)).join(',')+'}'; return JSON.stringify(value)??'null' }
export async function fingerprint(value: unknown): Promise<string> { const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(value)));return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('') }
export async function profileFingerprint(profile:ImportProfile):Promise<string>{
 const fields=profile.fields.map(f=>({key:f.field_key,section:f.section_key,labels:[f.label_fr,f.label_en,f.label_ar],help:f.help_fr,type:f.field_type,required:f.required,allowed:f.allowed_values,validation:f.validation,defaultValue:f.default_value,admin:f.admin_visible,csv:f.csv_enabled,public:f.public_visible,filter:f.filter_enabled,comparison:f.comparison_enabled,operations:f.operations_visible,order:f.sort_order,destination:f.destination,module:f.module,draftRequired:f.draftRequired,publishRequired:f.publishRequired,condition:f.conditional_rule||{},unit:f.unit})).sort((a,b)=>a.key.localeCompare(b.key,'en'))
 const variants=profile.schema.variant_groups.filter(v=>!('status'in v)||v.status==='active').map(v=>({key:v.group_key,labels:[v.label_fr,v.label_en,v.label_ar],selection:v.selection_type,required:v.required,values:v.values,media:v.affects_media,price:v.affects_price,availability:v.affects_availability,order:v.sort_order})).sort((a,b)=>a.key.localeCompare(b.key,'en'))
 return fingerprint({contract:CONTRACT,key:profile.key,version:profile.version,sellable:profile.sellable,identity:profile.identity,fields,variants,availability:profile.availability,journey:profile.journey,handover:profile.handover})
}
export async function templateDocument(profile:ImportProfile,target:ImportTarget){
  const hash=await fingerprint({profile:await profileFingerprint(profile),target:normalizeTarget(target)}), fields=targetFields(profile,target)
  const headers=[...MANAGED_HEADERS,...fields.map(f=>f.field_key),'_clear_fields']
  const metadata={_import_contract:CONTRACT,_profile_fingerprint:hash,_operation:target.task,template_version:profile.version,schema_key:profile.key}
  const blank={...metadata,...(fields.some(f=>f.field_key==='category_keys')?{category_keys:target.categoryKeys.join('|')}:{})}
  const example:Row={...blank,_operation:'EXAMPLE_ONLY',[profile.identity]:'example-'+profile.key}
  for(const f of fields)if(f.field_key!==profile.identity)example[f.field_key]=f.field_key==='category_keys'?target.categoryKeys.join('|'):f.example
  const stem=`ANGELCARE_${profile.key.toUpperCase().replaceAll('-','_')}_${target.task.toUpperCase()}_V${profile.version}_R2`
  return {stem,hash,headers,blank:csv([blank],headers),example:csv([example],headers),guide:{contract:CONTRACT,profile:profile.key,fingerprint:hash,version:profile.version,target,identity:profile.identity,journey:profile.journey,handover:profile.handover,rules:['Ne pas modifier les cinq colonnes de contrat.','Une cellule optionnelle vide conserve l’existant. 0 et false sont des valeurs.','Effacement explicite : _clear_fields, clés séparées par |.','Créations enregistrées en brouillon ; publication via readiness natif.','Les exemples sont illustratifs et ne doivent jamais être importés comme faits.','Les collections complémentaires utilisent les clés exactes ; pas de rapprochement approximatif.'],fields:fields.map(f=>({key:f.field_key,labels:{fr:f.label_fr,en:f.label_en,ar:f.label_ar},type:f.field_type,module:f.module,draftRequired:f.draftRequired,publishRequired:f.publishRequired,condition:f.conditional_rule||{},unit:f.unit,allowed:f.allowed_values,validation:f.validation,example:f.example,help:f.help_fr,destination:f.destination,public:f.public_visible,operations:f.operations_visible})),blockers:profile.blockers}}
}
export function prepareRows(profile:ImportProfile,target:ImportTarget,source:string,hash:string):PreparedRow[]{
  if(profile.blockers.length)throw Error(profile.blockers.join(' · '))
  const fields=targetFields(profile,target), known=new Map(fields.map(f=>[f.field_key,f])), input=parseCategoryNativeCsv(source)
  if(!input.length||input.length>10000)throw Error('Le fichier doit contenir de 1 à 10 000 offres.')
  const identities=new Map<string,number>()
  return input.map((original,index)=>{
    const number=index+2,values:Row={},issues:CellIssue[]=[]
    const problem=(key:string,message:string,severity:'error'|'warning'='error',expected='')=>issues.push({row:number,key,value:original[key],message,severity,expected})
    for(const [key,expected]of Object.entries({_import_contract:CONTRACT,_profile_fingerprint:hash,_operation:target.task,template_version:profile.version,schema_key:profile.key}))if(String(original[key])!==String(expected))problem(key,'Contrat ou version différent : téléchargez le template de cette cible.','error',String(expected))
    for(const key of Object.keys(original))if(!known.has(key)&&!MANAGED_HEADERS.includes(key)&&key!=='_clear_fields')problem(key,'Colonne étrangère à cette tâche. Aucune valeur ne sera ignorée.')
    const clears=text(original._clear_fields).split('|').filter(Boolean)
    for(const key of clears)if(!known.has(key)||key===profile.identity||['name_fr','slug'].includes(key))problem('_clear_fields',`Effacement interdit ou hors cible : ${key}.`)
    for(const f of fields){const value=original[f.field_key];if(!present(value))continue;const result=normalizeCategoryNativeField(f,value);values[f.field_key]=result.value;if(result.error)problem(f.field_key,result.error,'error',f.allowed_values.join(' | ')||f.field_type);if((f.field_type==='money'||f.field_key==='price_amount')&&Number.isFinite(Number(result.value))&&Math.abs(Number(result.value)*100-Math.round(Number(result.value)*100))>0.000001)problem(f.field_key,'Montant limité à deux décimales ; aucun arrondi implicite.','error','Montant exact au centime')}
    const identity=text(values[profile.identity]);if(!identity)problem(profile.identity,'Clé d’identité requise.');else if(identities.has(identity))problem(profile.identity,`Clé dupliquée : déjà présente à la ligne ${identities.get(identity)}.`);else identities.set(identity,number)
    if(target.task==='create'&&!present(values.name_fr))problem('name_fr','Le nom FR est requis pour enregistrer un nouveau brouillon.')
    for(const f of fields)if(conditionResolved(f.conditional_rule,values)&&!applies(f.conditional_rule,values)&&present(values[f.field_key]))problem(f.field_key,'Ce champ ne s’applique pas aux choix de cette ligne.')
    for(const [min,max]of [['age_min','age_max'],['minimum_duration_hours','maximum_duration_hours'],['price_rule_minimum','price_rule_maximum'],['availability_starts_at','availability_ends_at'],['start_date','end_date']])if(present(values[min])&&present(values[max])&&(min.includes('date')||min.endsWith('_at')?Date.parse(values[min])>Date.parse(values[max]):Number(values[min])>Number(values[max])))problem(max,`${max} doit être supérieur ou égal à ${min}.`)
    for(const f of fields.filter(f=>f.publishRequired&&applies(f.conditional_rule,values)))if(!present(values[f.field_key]))problem(f.field_key,'Dossier à compléter avant publication ; le brouillon reste autorisé.','warning',f.field_type)
    for(const key of ['media_json','variants_json','availability_json','price_rules_json'])if(Array.isArray(values[key])){const seen=new Set<string>();for(const entry of values[key]){if(!entry||typeof entry!=='object'||Array.isArray(entry)){problem(key,'Chaque entrée doit être un objet.');continue}const id=text(entry.media_key||entry.variant_key||entry.availability_key||entry.rule_key);if(id&&seen.has(id))problem(key,`Clé de collection dupliquée : ${id}.`);seen.add(id)}}
    for(const f of fields.filter(f=>f.field_type==='time_ranges'))if(Array.isArray(values[f.field_key]))for(const window of values[f.field_key])if(!window||!/^([01]\d|2[0-3]):[0-5]\d$/.test(window.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(window.end)||window.start>=window.end)problem(f.field_key,'Chaque plage exige start/end HH:MM avec end après start. Les nuits traversant minuit se préparent en deux plages.')
    return {number,identity,original,values,clears,issues,complete:!issues.some(i=>i.severity==='warning')}
  })
}
export function fullRejectedCsv(rows:PreparedRow[],headers:string[]):string{return csv(rows.filter(r=>r.issues.some(i=>i.severity==='error')).map(r=>r.original),headers)}
export function issueCsv(rows:PreparedRow[]):string{return csv(rows.flatMap(r=>r.issues),['row','key','value','expected','message','severity'])}
export function mergeIntent(before:unknown,incoming:unknown,mode:'add'|'remove'|'replace'):string[]{const read=(v:unknown)=>Array.isArray(v)?v.map(text).filter(Boolean):text(v).split('|').filter(Boolean);const a=read(before),b=read(incoming);return mode==='replace'?[...new Set(b)]:mode==='remove'?a.filter(v=>!b.includes(v)):[...new Set([...a,...b])]}
