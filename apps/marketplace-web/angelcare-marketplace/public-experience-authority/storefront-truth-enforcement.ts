import type {ComponentData,Data} from '@puckeditor/core'

export interface StorefrontTruthEnforcementReport {blocked:boolean;blockedStaticClaims:string[];sanitizedCount:number;reason:string|null}
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T
const risky=(value:string)=>{
 const tags:string[]=[]
 if(/(?:\d(?:[.,]\d)?\s*\/\s*5|\d(?:[.,]\d)?\s*[★⭐]|\b\d+\s+(?:avis|reviews?)\b)/i.test(value))tags.push('rating')
 if(/(?:plus\s+que\s+\d+|reste\s+\d+\s+(?:place|article|unit)|only\s+\d+\s+left|\d+\s+places?\s+restantes?)/i.test(value))tags.push('scarcity')
 if(/(?:-\s*\d{1,2}\s*%|\b\d{1,2}\s*%\s+(?:off|de\s+réduction)|offre\s+(?:flash|limitée|spéciale)|flash\s+sale)/i.test(value))tags.push('promotion')
 if(/(?:certifi[eé]\s+par|accr[eé]dit[eé]\s+par|agr[eé][eé]?\s+par|officially\s+certified)/i.test(value))tags.push('certification')
 return tags
}
/** Imported storefront copy is treated as design, never evidence. Unsupported static commerce claims are stripped before canonical sources run. */
export function enforceStorefrontStaticTruth(data:Data):{data:Data;report:StorefrontTruthEnforcementReport}{
 const copy=clone(data),claims:string[]=[],seen=new Set<unknown>();let sanitizedCount=0
 const walk=(value:unknown,path:string,parent?:Record<string,unknown>|unknown[],key?:string|number)=>{if(value===null||value===undefined)return;if(typeof value==='string'){const hits=risky(value);if(hits.length){claims.push(`${path}[${hits.join(',')}]:${value.slice(0,140)}`);if(parent!==undefined&&key!==undefined){(parent as any)[key]='';sanitizedCount++}}return}if(typeof value!=='object'||seen.has(value))return;seen.add(value);if(Array.isArray(value)){value.forEach((row,index)=>walk(row,`${path}[${index}]`,value,index));return}for(const [k,child] of Object.entries(value as Record<string,unknown>))walk(child,`${path}.${k}`,value as Record<string,unknown>,k)}
 ;(copy.content||[]).forEach((component:ComponentData,index)=>walk(component,`content[${index}]`));walk((copy as unknown as {root?:unknown}).root,'root')
 return{data:copy,report:{blocked:false,blockedStaticClaims:claims,sanitizedCount,reason:claims.length?'STOREFRONT_STATIC_CLAIMS_SANITIZED_BEFORE_CANONICAL_HYDRATION':null}}
}
