export type CustomerFact={key:string;label:string;value:string;raw?:unknown}
const unit:Record<string,string>={duration_hours:'h',minimum_duration_hours:'h',maximum_duration_hours:'h',maximum_continuous_hours:'h',minimum_lead_time_hours:'h',maximum_lead_time_hours:'h',monthly_included_hours:'h',session_duration_minutes:'min',play_duration_minutes:'min',rapid_confirmation_sla_minutes:'min',card_width_cm:'cm',card_height_cm:'cm',weight_grams:'g',storage_gb:'GB',space_requirements_m2:'m²'}
export function factText(row:CustomerFact,locale:'fr'|'en'|'ar'){
 const value=row.value;if(!/^\d+(?:[.,]\d+)?$/.test(value))return value
 const suffix=/^age_(min|max)$/.test(row.key)?({fr:'ans',en:'years',ar:'سنوات'}[locale]):unit[row.key]
 return suffix?value+' '+suffix:value
}
/** Combine only defined public pairs; keep the underlying dossier and comparison facts intact. */
export function compactFacts<T extends CustomerFact>(input:T[],locale:'fr'|'en'|'ar'):CustomerFact[]{
 const rows:CustomerFact[]=[];const used=new Set<string>();const pairs=[['age_min','age_max',{fr:'Âge conseillé',en:'Age range',ar:'الفئة العمرية'}],['minimum_duration_hours','maximum_duration_hours',{fr:'Durée de la prestation',en:'Service duration',ar:'مدة الخدمة'}],['site_minimum','site_maximum',{fr:'Périmètre des sites',en:'Site scope',ar:'نطاق المواقع'}]] as const
 for(const row of input){if(used.has(row.key))continue;const pair=pairs.find(([a,b])=>row.key===a||row.key===b),a=pair&&input.find(f=>f.key===pair[0]),b=pair&&input.find(f=>f.key===pair[1]);if(a&&b&&/^\d+(?:[.,]\d+)?$/.test(a.value)&&/^\d+(?:[.,]\d+)?$/.test(b.value)&&Number(a.value.replace(',','.'))<=Number(b.value.replace(',','.'))){used.add(a.key);used.add(b.key);const age=a.key==='age_min',duration=a.key.includes('duration'),suffix=age?({fr:'ans',en:'years',ar:'سنوات'}[locale]):duration?'h':({fr:'sites',en:'sites',ar:'مواقع'}[locale]);rows.push({key:a.key,label:pair![2][locale],value:a.value===b.value?a.value+' '+suffix:a.value+'–'+b.value+' '+suffix})}else{used.add(row.key);rows.push({...row,value:factText(row,locale)})}}
 return rows
}
