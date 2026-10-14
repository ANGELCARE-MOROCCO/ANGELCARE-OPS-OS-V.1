import {normalizeEditorial,type EditorialConfig} from './model'
import type {DossierDomain} from '../atomic-dossier/contract'
export type EditorialSnapshot={itemId:string;name:string;slug:string;status:string;schemaKey:string;domain:DossierDomain;updatedAt:string;canManage:boolean;config:EditorialConfig;media:Array<{key:string;url:string;label:string}>}
export type EditorialConflict={path:string;base:unknown;mine:unknown;remote:unknown}
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b)
/** Three-way merge. Different locale/placement edits merge; concurrent changes to the same leaf require a choice. */
export function mergeEditorial(base:EditorialConfig,mine:EditorialConfig,remote:EditorialConfig,domain:DossierDomain){
 const conflicts:EditorialConflict[]=[]
 function merge(a:unknown,b:unknown,c:unknown,path:string):unknown{if(equal(b,a))return c;if(equal(c,a)||equal(b,c))return b;const objects=[a,b,c].every(v=>v===undefined||v!==null&&typeof v==='object'&&!Array.isArray(v));if(objects){const out:Record<string,unknown>={},keys=new Set([...Object.keys(record(a)),...Object.keys(record(b)),...Object.keys(record(c))]);for(const key of keys){const value=merge(record(a)[key],record(b)[key],record(c)[key],path?path+'.'+key:key);if(value!==undefined)out[key]=value}return out}conflicts.push({path,base:a,mine:b,remote:c});return b}
 return{config:normalizeEditorial(merge(base,mine,remote,''),domain),conflicts}
}
export function chooseEditorialConflict(config:EditorialConfig,path:string,value:unknown,domain:DossierDomain){const result=JSON.parse(JSON.stringify(config)) as Record<string,unknown>,keys=path.split('.');let cursor=result;for(const key of keys.slice(0,-1)){if(!cursor[key]||typeof cursor[key]!=='object')cursor[key]={};cursor=cursor[key] as Record<string,unknown>}if(value===undefined)delete cursor[keys[keys.length-1]];else cursor[keys[keys.length-1]]=value;return normalizeEditorial(result,domain)}
