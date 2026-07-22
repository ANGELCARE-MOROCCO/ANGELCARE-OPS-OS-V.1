import crypto from 'node:crypto'
export function stableUuid(...parts:Array<string|number|undefined>){const hex=crypto.createHash('sha256').update(parts.map(x=>String(x??'')).join('|')).digest('hex').slice(0,32).split('');hex[12]='5';hex[16]=((parseInt(hex[16],16)&3)|8).toString(16);const h=hex.join('');return`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
export function code(prefix:string,...parts:Array<string|number|undefined>){const suffix=crypto.createHash('sha256').update(parts.map(x=>String(x??'')).join('|')).digest('hex').slice(0,10).toUpperCase();return`${prefix}-${suffix}`}
function canonical(value:unknown):unknown{if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object'){return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]))}return value}
export function hashObject(value:unknown){return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')}
export const isoNow=()=>new Date().toISOString()
