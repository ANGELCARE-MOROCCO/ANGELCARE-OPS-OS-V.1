import {publicUrl,type Related,type Locale} from './model'
export type RecommendationRow=Record<string,unknown>
const text=(v:unknown)=>typeof v==='string'?v.trim():''
export function serviceCandidate(row:RecommendationRow,currentId:string,territoryId:string|null,domainForSchema:(key:string)=>string|null):boolean{
 if(!text(row.id)||row.id===currentId||!text(row.slug)||!['service'].includes(text(row.kind))||row.status!=='published')return false
 if(text(row.territory_id)&&text(row.territory_id)!==(territoryId||''))return false
 const domain=domainForSchema(text(row.experience_schema_key));return !domain||domain==='b2c_service_family'
}
export function selectServiceRecommendations(rows:RecommendationRow[],input:{id:string;categoryKey:string|null;schemaKey:string|null;territoryId:string|null;locale:Locale;memberIds:Set<string>;limit:number},domainForSchema:(key:string)=>string|null):Related[]{
 const label=(r:RecommendationRow)=>text(r['name_'+input.locale])||text(r.name_fr)||text(r.name)
 const unique=[...new Map(rows.filter(r=>serviceCandidate(r,input.id,input.territoryId,domainForSchema)&&label(r)).map(r=>[text(r.id),r])).values()]
 const score=(r:RecommendationRow)=>(input.memberIds.has(text(r.id))?100000:0)+(input.categoryKey&&r.category_key===input.categoryKey?50000:0)+(input.schemaKey&&r.experience_schema_key===input.schemaKey?10000:0)+(r.featured?1000:0)+(Number.isFinite(Number(r.merchandising_priority))?Math.max(-500,Math.min(500,Number(r.merchandising_priority))):0)
 return unique.sort((a,b)=>score(b)-score(a)||label(a).localeCompare(label(b),input.locale)||text(a.id).localeCompare(text(b.id))).slice(0,input.limit).map(r=>({id:text(r.id),slug:text(r.slug),name:label(r),price:r.price_mode==='quote_only'||r.price_amount===null||r.price_amount===undefined?null:Number.isFinite(Number(r.price_amount))?Number(r.price_amount):null,currency:text(r.currency_label)||'Dh',priceMode:text(r.price_mode)||'fixed',image:publicUrl(r.media_url),availability:text(r.availability_status)}))
}
