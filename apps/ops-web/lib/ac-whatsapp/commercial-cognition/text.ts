export function normalizeText(value:unknown){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
export function clamp(value:number,min=0,max=1){return Math.max(min,Math.min(max,value))}
export function hasAny(text:string,terms:string[]){const n=normalizeText(text);return terms.some(term=>n.includes(normalizeText(term)))}
export function unique<T>(items:T[]){return Array.from(new Set(items))}
export function safeJsonArray(value:any){return Array.isArray(value)?value:[]}
export function safeObject(value:any){return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
export function compactMessage(row:any){return String(row?.body||row?.caption||row?.text||'').trim()}
export function recentInbound(messages:any[],limit=8){return messages.filter(row=>row.direction==='inbound').slice(-limit)}
export function recentOutbound(messages:any[],limit=8){return messages.filter(row=>row.direction==='outbound').slice(-limit)}
export function latestInbound(messages:any[]){return [...messages].reverse().find(row=>row.direction==='inbound')||null}
export function latestOutbound(messages:any[]){return [...messages].reverse().find(row=>row.direction==='outbound')||null}
export function hoursSince(value?:string|null){if(!value)return Infinity;const t=new Date(value).getTime();return Number.isFinite(t)?Math.max(0,(Date.now()-t)/3_600_000):Infinity}
