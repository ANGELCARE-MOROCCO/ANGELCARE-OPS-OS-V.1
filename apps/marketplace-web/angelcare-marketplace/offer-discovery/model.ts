import {cleanPublicStructure} from '../atomic-dossier/structured'
import {schemaContract,schemaLabel,type DossierDomain} from '../atomic-dossier/contract'
import {publicUrl,printable,type Locale} from '../product-commerce-experience/model'
export type DiscoveryMode='related'|'similar'|'complementary'
export type DiscoveryFact={key:string;label:string;value:string}
export type DiscoveryOffer={id:string;slug:string;name:string;lead:string;domain:DossierDomain;schemaKey:string;schemaLabel:string;sellableType:string;categoryKey:string|null;price:number|null;currency:string;priceMode:string;image:string|null;availability:string;reason:'relationship'|'category'|'schema';facts:DiscoveryFact[]}
export type DiscoverySelection={currentId:string;domain:DossierDomain;groups:Record<DiscoveryMode,DiscoveryOffer[]>;locale:Locale}
export type Candidate=Record<string,unknown>
export type SelectionContext={id:string;domain:DossierDomain;schemaKey:string;categoryKey:string|null;territoryId:string|null;locale:Locale;sellableType:string;memberIds:Set<string>;relations:Record<string,string[]>;limit:number}
export const text=(v:unknown):string=>typeof v==='string'?v.trim():''
export const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const defaultDomain:Record<string,DossierDomain>={product:'product',kit:'product',training:'academy',audit:'b2b',saas_module:'b2b',service:'service'}
export function candidateDomain(row:Candidate):DossierDomain|null{return schemaContract(text(row.experience_schema_key))?.domain||defaultDomain[text(row.kind)]||null}
export function eligibleCandidate(row:Candidate,context:SelectionContext):boolean{if(!text(row.id)||row.id===context.id||!text(row.slug)||row.status!=='published'||!candidateDomain(row))return false;const territory=text(row.territory_id);return !territory||territory===context.territoryId}
const compareKeys:Record<DossierDomain,string[]>={product:['age_min','age_max','material','materials','file_formats','license_type','number_of_cards','difficulty','players_min','players_max','play_duration_minutes','subscription_frequencies'],service:['age_min','age_max','minimum_duration_hours','recurrence_types','monthly_included_hours','session_duration_minutes','delivery_modes','non_medical_boundary','property_types'],academy:['course_subject','level','duration_hours','delivery_modality','language','start_date','academic_year','class_level','assessment_type'],b2b:['organization_type','site_minimum','site_maximum','included_modules','user_limit','support_level','assessment_mode','contract_duration_months','billing_model']}
export function publicComparisonFacts(row:Candidate,locale:Locale):DiscoveryFact[]{const contract=schemaContract(text(row.experience_schema_key)),domain=candidateDomain(row),attributes=record(row.attributes);if(!domain||!contract)return[];return compareKeys[domain].flatMap(key=>{const field=contract.fields[key],value=attributes[key];if(!field||value===null||value===undefined||value==='')return[];const formatted=printable(cleanPublicStructure(value),locale);return formatted?[{key,label:field.labels[locale]||key,value:formatted.slice(0,600)}]:[]}).slice(0,5)}
function mapped(row:Candidate,context:SelectionContext,reason:DiscoveryOffer['reason']):DiscoveryOffer{const domain=candidateDomain(row)!,schemaKey=text(row.experience_schema_key),amount=row.price_amount===null||row.price_amount===undefined||row.price_amount===''?null:Number(row.price_amount);return{id:text(row.id),slug:text(row.slug),name:text(row['name_'+context.locale])||text(row.name_fr)||text(row.name),lead:(text(row['short_description_'+context.locale])||text(row.short_description_fr)||text(row.short_description)).slice(0,320),domain,schemaKey,schemaLabel:schemaLabel(schemaKey,context.locale),sellableType:text(row.sellable_type),categoryKey:text(row.category_key)||null,price:amount!==null&&Number.isFinite(amount)&&amount>=0&&!['quote','quote_only'].includes(text(row.price_mode))?amount:null,currency:text(row.currency_label)||'MAD',priceMode:text(row.price_mode)||'fixed',image:publicUrl(row.media_url),availability:text(row.availability_status),reason,facts:publicComparisonFacts(row,context.locale)}}
/** Pure ranking. Canonical rows and native taxonomy are never mutated. Complements require declared links. */
export function selectOfferDiscovery(rows:Candidate[],context:SelectionContext):DiscoverySelection{
 const domain=schemaContract(context.schemaKey)?.domain||context.domain,groups:DiscoverySelection['groups']={related:[],similar:[],complementary:[]};const byId=new Map<string,Candidate>();for(const row of rows)if(eligibleCandidate(row,context)&&!byId.has(text(row.id))&&(text(row['name_'+context.locale])||text(row.name_fr)||text(row.name)))byId.set(text(row.id),row)
 const alternatives=new Set([...(context.relations.alternative_ids||[]),...(context.relations.upsell_ids||[])]),complements=new Set([...(context.relations.cross_sell_ids||[]),...(context.relations.bundle_ids||[])]),ranked:Array<{row:Candidate;mode:DiscoveryMode;reason:DiscoveryOffer['reason'];score:number}>=[]
 for(const row of byId.values()){
  const id=text(row.id),sameDomain=candidateDomain(row)===domain,sameSchema=!!context.schemaKey&&row.experience_schema_key===context.schemaKey,sameCategory=context.memberIds.has(id)||!!context.categoryKey&&row.category_key===context.categoryKey,sameSellable=!!context.sellableType&&row.sellable_type===context.sellableType
  let mode:DiscoveryMode,reason:DiscoveryOffer['reason'],score=0
  if(complements.has(id)){mode='complementary';reason='relationship';score=10000-(context.relations.cross_sell_ids||[]).indexOf(id)}
  else if(alternatives.has(id)&&sameDomain){mode='similar';reason='relationship';score=9000}
  else if(sameDomain&&sameCategory&&(sameSchema||sameSellable)){mode='similar';reason='category';score=6000+(sameSchema?500:0)}
  else if(sameDomain&&(sameCategory||sameSchema)){mode='related';reason=sameCategory?'category':'schema';score=sameCategory?4500:3000}
  else continue
  score+=Math.min(200,Math.max(-200,Number(row.merchandising_priority)||0))+(row.featured===true?100:0)
  ranked.push({row,mode,reason,score})
 }
 ranked.sort((a,b)=>b.score-a.score||text(a.row['name_'+context.locale]||a.row.name_fr).localeCompare(text(b.row['name_'+context.locale]||b.row.name_fr),context.locale)||text(a.row.id).localeCompare(text(b.row.id)))
 const limit=Math.min(12,Math.max(1,context.limit));for(const entry of ranked)if(groups[entry.mode].length<limit)groups[entry.mode].push(mapped(entry.row,context,entry.reason))
 return{currentId:context.id,domain,locale:context.locale,groups}
}
export function safeDiscoveryOffer(value:unknown,currentId:string):value is DiscoveryOffer{const row=record(value);return typeof row.id==='string'&&row.id!==currentId&&typeof row.slug==='string'&&!!row.slug&&typeof row.name==='string'&&!!row.name&&['product','service','academy','b2b'].includes(String(row.domain))&&Array.isArray(row.facts)}
