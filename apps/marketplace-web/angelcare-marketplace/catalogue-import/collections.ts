import { parseCategoryNativeCsv } from '../category-native/validation'
import { bindingsFromRows,safeRelativePath,csv, present, text, type Row } from '../catalogue-population/model'
import type { ImportProfile, ImportTarget, PreparedRow } from './contract'
import { targetFields } from './contract'

export type CollectionContract = { key:string; label:string; field:string; headers:string[]; destination:string; required:string[]; shape:'array'|'object'; examples:Row[] }
const definitions:Record<string,Omit<CollectionContract,'key'|'field'|'destination'>>={
 variants_json:{label:'Variantes commerciales',headers:['variant_key','name_fr','name_en','name_ar','sku','price_delta','price_override','media_asset_reference','territory_code','available','status','sort_order','option_values_json'],required:['variant_key','name_fr'],shape:'array',examples:[]},
 components:{label:'Contenu du kit',headers:['entry_key','name','name_fr','name_en','name_ar','quantity','reference','description_fr','description_en','description_ar','sort_order'],required:['entry_key','name','quantity'],shape:'array',examples:[]},
 kit_contents:{label:'Contenu commercial du kit',headers:['entry_key','name','name_fr','name_en','name_ar','quantity','reference','sort_order'],required:['entry_key','name','quantity'],shape:'array',examples:[]},
 availability_json:{label:'Disponibilités natives',headers:['entry_key','territory_code','audience','available','capacity_limit','starts_at','ends_at','reason','sort_order'],required:['entry_key','territory_code','audience','available'],shape:'array',examples:[]},
 price_rules_json:{label:'Règles tarifaires Finance',headers:['rule_key','price_book_reference','pricing_model','unit_label','minimum_price','standard_price','maximum_price','currency_label','status','sort_order'],required:['rule_key','pricing_model'],shape:'array',examples:[]},
 media_json:{label:'Galerie et placements',headers:['media_key','reference','sort_order','alt_text_fr','alt_text_en','alt_text_ar','media_type','status'],required:['media_key','reference'],shape:'array',examples:[]},
}
export function collectionContracts(profile:ImportProfile,target:ImportTarget):CollectionContract[]{
 return targetFields(profile,target).filter(f=>['json','component_list','time_ranges'].includes(f.field_type)).map(f=>{
  const known=definitions[f.field_key],time=f.field_type==='time_ranges'
  return {key:f.field_key,field:f.field_key,label:known?.label||f.label_fr,destination:f.destination,shape:known?.shape||(time||f.field_type==='component_list'?'array':'object'),headers:['item_key',...(known?.headers||(time?['entry_key','day','start','end','sort_order']:['entry_key','payload_json','sort_order']))],required:known?.required||(time?['entry_key','start','end']:['entry_key','payload_json']),examples:[]}
 })
}
export function collectionTemplate(contract:CollectionContract){return csv([],contract.headers)}
/** Companion sheets are an alternative to inline JSON, never a second authority. */
export function applyCollections(rows:PreparedRow[],inputs:Record<string,string>,contracts:CollectionContract[]):PreparedRow[]{
 const result=rows.map(r=>({...r,values:{...r.values},original:{...r.original},issues:[...r.issues]})),byKey=new Map(result.map(r=>[r.identity,r]))
 for(const [key,source]of Object.entries(inputs)){
  const contract=contracts.find(c=>c.key===key);if(!contract)throw Error('Collection hors cible : '+key)
  if(!source.trim())continue
  const grouped=new Map<string,Row[]>(),seen=new Set<string>()
  for(const [index,input]of parseCategoryNativeCsv(source).entries()){
   for(const field of Object.keys(input))if(!contract.headers.includes(field))throw Error(`${key}, ligne ${index+2} : colonne inconnue ${field}.`)
   const parent=text(input.item_key);if(!byKey.has(parent))throw Error(`${key}, ligne ${index+2} : parent exact absent du fichier principal (${parent}).`)
   for(const field of contract.required)if(!present(input[field]))throw Error(`${key}, ligne ${index+2} : ${field} requis.`)
   const entryKey=text(input.entry_key||input.variant_key||input.media_key||input.rule_key),identity=parent+'|'+entryKey
   if(!entryKey||seen.has(identity))throw Error(`${key}, ligne ${index+2} : clé d’entrée absente ou dupliquée.`);seen.add(identity)
   let entry:Row={}
   if(input.payload_json){try{entry=JSON.parse(input.payload_json as string)}catch{throw Error(`${key}, ligne ${index+2} : payload_json invalide.`)}if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('Une entrée exige un objet JSON.')}
   else for(const [field,value]of Object.entries(input)){
    if(field==='item_key'||!present(value))continue
    if(field.endsWith('_json')){try{entry[field.slice(0,-5)]=JSON.parse(value as string)}catch{throw Error(`${key} : ${field} JSON invalide.`)}}
    else if(['quantity','sort_order','price_delta','price_override','capacity_limit','minimum_price','standard_price','maximum_price'].includes(field)){const n=Number(value);if(!Number.isFinite(n)||(['sort_order','quantity','capacity_limit'].includes(field)&&!Number.isSafeInteger(n)))throw Error(`${key} : ${field} numérique exact requis.`);entry[field]=n}
    else if(field==='available'){if(!['true','false'].includes(String(value)))throw Error(`${key} : available=true/false requis.`);entry[field]=value==='true'}
    else entry[field]=value
   }
   grouped.set(parent,[...(grouped.get(parent)||[]),entry])
  }
  for(const [parent,entries]of grouped){const row=byKey.get(parent)!;if(present(row.values[key]))throw Error(`${parent} : ${key} est fourni en JSON et en collection ; choisissez une seule représentation.`);const sorted=entries.sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));row.values[key]=contract.shape==='object'?Object.fromEntries(sorted.map(e=>[text(e.entry_key),Object.fromEntries(Object.entries(e).filter(([k])=>k!=='entry_key'))])):sorted;row.original[key]=JSON.stringify(row.values[key])}
 }
 return result
}
export const MEDIA_HEADERS=['file_path','item_key','role','sort_order','asset_key','alt_text_fr','alt_text_en','alt_text_ar','sha256','variant_key']
export function mediaBindings(input:Row[]):Row[]{
 const ordinary=bindingsFromRows(input.filter(r=>r.role!=='variant')) as Row[],seen=new Set<string>()
 const variants=input.filter(r=>r.role==='variant').map(r=>{const itemKey=text(r.item_key),variantKey=text(r.variant_key),path=safeRelativePath(r.file_path);if(!itemKey||!variantKey)throw Error('Média de variante : item_key et variant_key exacts requis.');const key=itemKey+'|'+variantKey;if(seen.has(key))throw Error('Deux médias pour la même variante.');seen.add(key);return{path,itemKey,role:'variant',variantKey,order:0,existingAssetKey:text(r.asset_key)||undefined,checksum:text(r.sha256)||undefined,altFr:text(r.alt_text_fr),altEn:text(r.alt_text_en),altAr:text(r.alt_text_ar)}})
 const all=[...ordinary,...variants],paths=new Map<string,Row>()
 for(const v of all){const prior=paths.get(v.path);if(prior&&(prior.existingAssetKey!==v.existingAssetKey||prior.checksum!==v.checksum))throw Error('Sources différentes pour le même chemin média.');paths.set(v.path,v)}
 return all
}
export function controlledMediaCandidates(fileNames:string[],identities:string[]){
 const candidates:Row[]=[],unresolved:string[]=[]
 for(const file_path of fileNames){const name=file_path.split('/').at(-1)||'',stem=name.replace(/\.[^.]+$/,'');const parts=stem.split('__');const itemKey=parts[0],role=parts[1]
  if(parts.length<2||!identities.includes(itemKey)||!['primary','gallery','variant','editorial-desire','editorial-understand','editorial-guidance'].includes(role)){unresolved.push(file_path);continue}
  const order=role==='primary'||role==='variant'?0:Number(parts[2]||0);if(!Number.isSafeInteger(order)||order<0||role==='variant'&&!parts[2]){unresolved.push(file_path);continue}
  candidates.push({file_path,item_key:itemKey,role,sort_order:order,asset_key:'',alt_text_fr:'',alt_text_en:'',alt_text_ar:'',sha256:'',variant_key:role==='variant'?parts[2]:''})
 }
 return {candidates,unresolved}
}
export const ACADEMY_HEADERS=['item_key','entity','key','parent_key','title_fr','description_fr','duration_minutes','delivery_mode','capacity','starts_at','ends_at','content_reference','sort_order','target_audience','learning_objectives_json','attendance_threshold','passing_score','certificate_type','certificate_validity_days']
export function academyCompanions(source:string,identities:string[]):Row[]{
 if(!source.trim())return[]
 const input=parseCategoryNativeCsv(source) as Row[],seen=new Set<string>()
 return input.map((row,index)=>{
  for(const k of Object.keys(row))if(!ACADEMY_HEADERS.includes(k))throw Error('Academy : colonne inconnue '+k)
  if(!identities.includes(text(row.item_key)))throw Error('Academy : offre parente hors fichier principal.')
  if(!['program','course','module','cohort'].includes(text(row.entity)))throw Error('Academy : entity=program/course/module/cohort.')
  if(!/^[a-z0-9][a-z0-9-]{2,120}$/.test(text(row.key)))throw Error('Academy : clé stable en minuscules, chiffres et tirets requise.')
  const id=row.item_key+'|'+row.entity+'|'+row.key;if(seen.has(id))throw Error('Academy : clé dupliquée '+id);seen.add(id)
  if(!text(row.title_fr))throw Error(`Academy ligne ${index+2} : title_fr requis.`)
  for(const k of ['duration_minutes','capacity','sort_order','attendance_threshold','passing_score','certificate_validity_days'])if(present(row[k])){const n=Number(row[k]);if(!Number.isSafeInteger(n)||n<0)throw Error(`Academy : ${k} entier positif requis.`);row[k]=n}
  if(row.entity==='course'&&(!text(row.parent_key)||Number(row.duration_minutes)<=0||!['in_person','online_live','hybrid','self_paced'].includes(text(row.delivery_mode))))throw Error('Academy course : programme parent, durée positive et delivery_mode requis.')
  if(['cohort','module'].includes(text(row.entity))&&!text(row.parent_key))throw Error('Academy : cours parent requis.')
  if(row.entity==='cohort'&&Number(row.capacity)<=0)throw Error('Academy cohort : capacité positive requise.')
  for(const k of ['starts_at','ends_at'])if(present(row[k])&&(!/(Z|[+-]\d{2}:\d{2})$/.test(text(row[k]))||!Number.isFinite(Date.parse(row[k]))))throw Error('Academy : date ISO avec fuseau requis.')
  if(row.starts_at&&row.ends_at&&Date.parse(row.starts_at)>=Date.parse(row.ends_at))throw Error('Academy : ends_at doit suivre starts_at.')
  if(row.learning_objectives_json){try{const a=JSON.parse(row.learning_objectives_json);if(!Array.isArray(a))throw Error();row.learning_objectives=a}catch{throw Error('Academy : learning_objectives_json doit être une liste.')}}
  return row
 })
}
