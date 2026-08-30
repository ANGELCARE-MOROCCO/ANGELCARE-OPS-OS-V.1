export type RuntimeLocale='fr'|'en'|'ar'
export type RuntimeScope='public'|'private'|'admin'
export type LocalizationDictionary={locale:RuntimeLocale;direction:'ltr'|'rtl';byKey:Record<string,string>;bySource:Record<string,string>;byTemplate:Record<string,string>}
type Row=Record<string,unknown>
const text=(value:unknown)=>typeof value==='string'?value.trim():''
const rows=(value:unknown):Row[]=>Array.isArray(value)?value.filter(item=>Boolean(item)&&typeof item==='object') as Row[]:[]

export function buildPublishedDictionaryFromRows(locale:RuntimeLocale,data:unknown,scope:RuntimeScope='public'):LocalizationDictionary{
 const byKey:Record<string,string>={},bySource:Record<string,string>={},byTemplate:Record<string,string>={},ambiguous=new Set<string>()
 for(const row of rows(data)){const candidate=(row.candidate||{})as Row,target=text(row.translation_text),source=text(candidate.source_text_fr),key=text(candidate.translation_key),audience=text(candidate.audience);if(audience&&audience!=='shared'&&audience!==scope&&!(scope!=='public'&&audience==='public'))continue;if(text(row.status)!=='published'||text(row.freshness_state)!=='current'||!target||!source||!key||text(row.source_hash_at_translation)!==text(candidate.source_hash)||['orphaned','changed','blocked'].includes(text(candidate.freshness_state)))continue;byKey[key]=target;if(ambiguous.has(source))continue;if(!bySource[source])bySource[source]=target;else if(bySource[source]!==target){delete bySource[source];delete byTemplate[source];ambiguous.add(source)}if(source.includes('{{')&&!ambiguous.has(source))byTemplate[source]=target}
 return{locale,direction:locale==='ar'?'rtl':'ltr',byKey,bySource,byTemplate}
}

const PLACEHOLDER=/\{\{\s*([\w.-]+)\s*\}\}/g
const regexEscape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
export function resolveRuntimeText(source:string,dictionary:LocalizationDictionary){const exact=dictionary.bySource[source];if(exact)return exact;for(const[template,target]of Object.entries(dictionary.byTemplate)){const names:string[]=[];let pattern='^',cursor=0;for(const placeholder of template.matchAll(PLACEHOLDER)){pattern+=regexEscape(template.slice(cursor,placeholder.index))+'(.+?)';names.push(placeholder[1]);cursor=(placeholder.index||0)+placeholder[0].length}pattern+=regexEscape(template.slice(cursor))+'$';const match=source.match(new RegExp(pattern));if(!match)continue;const values=new Map(names.map((name,index)=>[name,match[index+1]||'']));return target.replace(PLACEHOLDER,(_placeholder,name:string)=>values.get(name)||'')}return source}
