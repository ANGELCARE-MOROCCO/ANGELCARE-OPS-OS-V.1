/** A bounded, item-scoped client draft. It conveys intent, never price or eligibility. */
export const selectionKey = (slug:string,locale:string) => `ac-atomic-selection-v1:${locale}:${slug}`
export function cleanSelection(value:unknown, allowedKeys?: Set<string>): Record<string,unknown> {
  if(!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out:Record<string,unknown>={}
  for(const [key,v] of Object.entries(value).slice(0,64)) {
    if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,80}$/.test(key) || ['__proto__','constructor','prototype'].includes(key) || (allowedKeys&&!allowedKeys.has(key))) continue
    if(typeof v==='string' && v.length<=1000) out[key]=v
    else if(typeof v==='number' && Number.isFinite(v)) out[key]=v
    else if(typeof v==='boolean') out[key]=v
    else if(Array.isArray(v) && v.length<=32 && v.every(x=>typeof x==='string'&&x.length<=200)) out[key]=v
  }
  return out
}
export function saveSelection(slug:string,locale:string,selection:Record<string,unknown>): boolean {
  try { sessionStorage.setItem(selectionKey(slug,locale),JSON.stringify({version:1,savedAt:Date.now(),selection:cleanSelection(selection)}));return true } catch { return false }
}
export function readSelection(slug:string,locale:string,allowedKeys:Set<string>):Record<string,unknown> {
  try { const v=JSON.parse(sessionStorage.getItem(selectionKey(slug,locale))||'null');return v?.version===1 && Number.isFinite(v.savedAt) && Date.now()-v.savedAt<24*60*60*1000 ? cleanSelection(v.selection,allowedKeys) : {} } catch { return {} }
}
export function selectionHref(base:string,selection:Record<string,unknown>):string {
  const encoded=JSON.stringify(cleanSelection(selection))
  // URL survives an authentication redirect; storage is a same-tab resilience layer.
  return encoded.length<=6000 ? `${base}?selection=${encodeURIComponent(encoded)}` : base
}
export function selectionFromSearch(search:string,allowedKeys:Set<string>):Record<string,unknown> {
  try { const raw=new URLSearchParams(search).get('selection');return raw&&raw.length<=6000?cleanSelection(JSON.parse(raw),allowedKeys):{} } catch { return {} }
}
