import { createHash, randomUUID } from 'node:crypto'
export function stableHash(value:unknown):string{return createHash('sha256').update(JSON.stringify(value,Object.keys((value&&typeof value==='object'?value:{}) as object).sort())).digest('hex')}
export function newId():string{return randomUUID()}
export function redactDeep(value:unknown):unknown{
 if(Array.isArray(value))return value.map(redactDeep)
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[/token|secret|password|authorization|api[_-]?key|credential|cookie/i.test(key)?key:key,/token|secret|password|authorization|api[_-]?key|credential|cookie/i.test(key)?'[REDACTED]':redactDeep(item)]))
 return value
}
