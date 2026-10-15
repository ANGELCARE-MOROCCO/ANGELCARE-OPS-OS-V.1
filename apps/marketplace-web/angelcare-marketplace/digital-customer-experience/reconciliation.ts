import { object, type Data, type DceRecord } from './types'
export interface Conflict {path:string;base:unknown;mine:unknown;latest:unknown}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b)
/** Three-way reconciliation preserves remote changes and keeps explicit conflicts reviewable. */
export function reconcileDraft(base:Partial<DceRecord>,mine:Partial<DceRecord>,latest:DceRecord,choices:Record<string,'mine'|'latest'>={}){
 const conflicts:Conflict[]=[]
 function merge(before:unknown,left:unknown,right:unknown,path:string):unknown {
  if(same(left,before))return right;if(same(right,before)||same(left,right))return left
  if(before&&left&&right&&typeof before==='object'&&typeof left==='object'&&typeof right==='object'&&!Array.isArray(before)&&!Array.isArray(left)&&!Array.isArray(right)){
   const a=object(before),b=object(left),c=object(right),out:Record<string,unknown>={};for(const key of new Set([...Object.keys(a),...Object.keys(b),...Object.keys(c)])){const value=merge(a[key],b[key],c[key],path?path+'.'+key:key);if(value!==undefined)out[key]=value}return out
  }
  // Collection order/removal can change meaning; never silently merge conflicting arrays.
  conflicts.push({path,base:before,mine:left,latest:right});return choices[path]==='latest'?right:left
 }
 const authored=['title','family','topic','audience','data'] as const,out={...latest}
 for(const key of authored)Object.assign(out,{[key]:merge(base[key],mine[key],latest[key],key)})
 return {record:out,conflicts,unresolved:conflicts.filter(c=>!choices[c.path])}
}
