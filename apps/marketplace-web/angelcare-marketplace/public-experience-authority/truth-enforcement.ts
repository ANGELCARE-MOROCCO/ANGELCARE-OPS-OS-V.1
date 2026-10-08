import type {ComponentData,Data} from '@puckeditor/core'
import type {PublicExperienceTruthEnforcementReport,PublicExperienceTruthReport} from './types'

const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T
const decision=(report:PublicExperienceTruthReport,key:string)=>report.decisions.find(row=>row.key===key)?.state==='PROVEN'
const propClass=(key:string):string|null=>{
 const k=key.toLowerCase()
 if(/rating|stars?|review_count|reviewcount|reviews_count|reviewsummary|reviewlabel/.test(k))return'rating'
 if(/scarcity|remaining|remainingstock|remaining_stock|stocklabel|stock_label|seatsremaining|placesremaining|quantityleft/.test(k))return'scarcity'
 if(/discount|compareat|compare_at|oldprice|old_price|promotion|promo|countdown|urgency|sale_badge|salebadge/.test(k))return'promotion'
 if(/certification|certificatebadge|certificate_badge|accreditation|accredited|certified/.test(k))return'certification'
 return null
}
const riskyText=(value:string,truth:PublicExperienceTruthReport)=>{
 const hits:string[]=[]
 if(!decision(truth,'rating')&&/(?:\d(?:[.,]\d)?\s*\/\s*5|\d(?:[.,]\d)?\s*[★⭐]|\b\d+\s+avis\b|\b\d+\s+reviews?\b)/i.test(value))hits.push('rating')
 if(!decision(truth,'scarcity')&&/(?:plus\s+que\s+\d+|reste\s+\d+\s+(?:place|article|unit)|only\s+\d+\s+left|\d+\s+places?\s+restantes?)/i.test(value))hits.push('scarcity')
 if(!decision(truth,'promotion')&&/(?:-\s*\d{1,2}\s*%|\b\d{1,2}\s*%\s+(?:off|de\s+réduction)|offre\s+(?:flash|limitée|spéciale)|flash\s+sale)/i.test(value))hits.push('promotion')
 if(!decision(truth,'certification')&&/(?:certifi[eé]\s+par|accr[eé]dit[eé]\s+par|agr[eé][eé]?\s+par|officially\s+certified)/i.test(value))hits.push('certification')
 return hits
}

export function enforcePublicExperienceTruthOnData(data:Data,truth:PublicExperienceTruthReport):{data:Data;report:PublicExperienceTruthEnforcementReport}{
 const copy=clone(data),removedProps:string[]=[],blockedStaticClaims:string[]=[],decisionKeys=new Set<string>(),seen=new Set<unknown>();let sanitizedComponentCount=0
 const walkValue=(value:unknown,path:string):unknown=>{
  if(value===null||value===undefined)return value
  if(typeof value==='string'){
   const hits=riskyText(value,truth);if(hits.length){for(const hit of hits)decisionKeys.add(hit);blockedStaticClaims.push(`${path}:${value.slice(0,140)}`);sanitizedComponentCount++;return ''}
   return value
  }
  if(typeof value!=='object')return value
  if(seen.has(value))return value;seen.add(value)
  if(Array.isArray(value)){value.forEach((row,index)=>{value[index]=walkValue(row,`${path}[${index}]`)});return value}
  const row=value as Record<string,unknown>
  for(const key of Object.keys(row)){
   const cls=propClass(key);if(cls&&!decision(truth,cls)){
    const current=row[key]
    if(current!==null&&current!==undefined&&current!==''&&current!==false){delete row[key];removedProps.push(`${path}.${key}`);decisionKeys.add(cls);sanitizedComponentCount++}
    continue
   }
   row[key]=walkValue(row[key],`${path}.${key}`)
  }
  return row
 }
 ;(copy.content||[]).forEach((component:ComponentData,index)=>walkValue(component,`content[${index}]`));walkValue((copy as unknown as {root?:unknown}).root,'root')
 const blocked=false
 return{data:copy,report:{blocked,removedProps,blockedStaticClaims,decisionKeys:[...decisionKeys],sanitizedComponentCount,reason:blockedStaticClaims.length||removedProps.length?'UNSUPPORTED_CLAIMS_SANITIZED_FAIL_CLOSED':null}}
}
