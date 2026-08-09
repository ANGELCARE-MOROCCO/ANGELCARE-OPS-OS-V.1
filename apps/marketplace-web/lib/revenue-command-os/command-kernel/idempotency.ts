import { createHash } from 'node:crypto'
export function stableStringify(value:unknown):string{if(Array.isArray(value))return`[${value.map(stableStringify).join(',')}]`;if(value&&typeof value==='object')return`{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;return JSON.stringify(value)}
export function sha256(value:unknown){return createHash('sha256').update(typeof value==='string'?value:stableStringify(value)).digest('hex')}
export function createRunIdempotencyKey(input:{tenantId:string;situationId:string;commandCodes:string[];mode:string;contextFingerprint:string;window:string}){return`rck_${sha256(input)}`}
