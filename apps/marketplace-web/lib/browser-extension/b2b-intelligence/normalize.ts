import type { BrowserBusinessContext } from './types'

export function cleanText(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null
  const out=value.replace(/\s+/g,' ').trim()
  return out ? out.slice(0,max) : null
}
export function normalizeDomain(value: unknown): string | null {
  const raw=cleanText(value,500)
  if(!raw) return null
  try { const withProtocol=/^https?:\/\//i.test(raw)?raw:`https://${raw}`; return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./,'') || null } catch { return raw.toLowerCase().replace(/^www\./,'').split('/')[0] || null }
}
export function normalizePhone(value: unknown): string | null {
  const raw=cleanText(value,80); if(!raw) return null
  const plus=raw.trim().startsWith('+')?'+':''; const digits=raw.replace(/\D/g,''); return digits.length>=7?`${plus}${digits}`:null
}
export function normalizeEmail(value: unknown): string | null {
  const raw=cleanText(value,254)?.toLowerCase() || null
  return raw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : null
}
export function normalizeName(value: unknown): string {
  return (cleanText(value,240)||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()
}
export function normalizedContext(input: unknown): BrowserBusinessContext {
  const row=(input&&typeof input==='object'?input:{}) as Record<string,any>; const org=(row.organization&&typeof row.organization==='object'?row.organization:{}) as Record<string,any>
  const url=cleanText(row.url,2000)||''; let origin=cleanText(row.origin,500)
  if(!origin&&url){ try{origin=new URL(url).origin}catch{} }
  const website=cleanText(org.website,2000)||url||null
  return {
    adapterId:(cleanText(row.adapterId,80)||'generic_web') as any,
    pageType:(cleanText(row.pageType,80)||'unknown') as any,
    url,
    origin,
    title:cleanText(row.title,500), selectedText:cleanText(row.selectedText,3000),
    organization:{
      name:cleanText(org.name,240), legalName:cleanText(org.legalName,240), domain:normalizeDomain(org.domain||website), sector:cleanText(org.sector,120), subSector:cleanText(org.subSector,120), city:cleanText(org.city,120), address:cleanText(org.address,500), phone:normalizePhone(org.phone), email:normalizeEmail(org.email), website, description:cleanText(org.description,1500), category:cleanText(org.category,160), googleMapsUrl:cleanText(org.googleMapsUrl,2000), placeId:cleanText(org.placeId,200), socialLinks:Array.isArray(org.socialLinks)?org.socialLinks.map((x:unknown)=>cleanText(x,1000)).filter(Boolean) as string[]:[], signals:Array.isArray(org.signals)?org.signals.map((x:unknown)=>cleanText(x,300)).filter(Boolean) as string[]:[],
    },
    contacts:Array.isArray(row.contacts)?row.contacts.slice(0,25).map((c:any)=>({name:cleanText(c?.name,200),role:cleanText(c?.role,160),department:cleanText(c?.department,160),email:normalizeEmail(c?.email),phone:normalizePhone(c?.phone),linkedin:cleanText(c?.linkedin,1000)})):[],
    evidence:Array.isArray(row.evidence)?row.evidence.slice(0,100).map((e:any)=>({type:cleanText(e?.type,80)||'observed',fieldKey:cleanText(e?.fieldKey,100),value:cleanText(e?.value,3000)||'',confidence:Math.max(0,Math.min(1,Number(e?.confidence??0.65))),sourceUrl:cleanText(e?.sourceUrl,2000)||url||null,metadata:e?.metadata&&typeof e.metadata==='object'?e.metadata:{}})).filter((e:any)=>e.value):[],
    metadata:row.metadata&&typeof row.metadata==='object'?row.metadata:{},
  }
}
export function similarity(a: unknown,b: unknown){ const aa=normalizeName(a),bb=normalizeName(b); if(!aa||!bb)return 0; if(aa===bb)return 1; const as=new Set(aa.split(' ')),bs=new Set(bb.split(' ')); const overlap=[...as].filter((x)=>bs.has(x)).length; const union=new Set([...as,...bs]).size; return union?overlap/union:0 }
