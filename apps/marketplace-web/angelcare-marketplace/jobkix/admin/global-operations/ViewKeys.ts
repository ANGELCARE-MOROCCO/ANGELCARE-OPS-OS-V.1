/** Deterministic public navigation keys, not an authorization system. */
import {getTabSpec} from './TabRegistry';
export const slugKey=(s:string)=>s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,74);
export function lensKeys(workspace:string,tab:string):string[]{
 const spec=getTabSpec(workspace,tab);
 return spec?spec.lenses.map((s,i)=>`${String(i+1).padStart(2,'0')}-${slugKey(s)}`):[];
}
export function normalizedView(workspace:string,tab:string,proposed:unknown):string{
 const keys=lensKeys(workspace,tab);
 if(!keys.length)return '';
 if(typeof proposed!=='string')return keys[0];
 if(keys.includes(proposed))return proposed;
 const numeric=Number(proposed);
 if(/^[0-3]$/.test(proposed)&&keys[numeric])return keys[numeric];
 return keys[0];
}
export function viewURL(workspace:string,tab:string,view:string,page?:number):string{
 const qs=new URLSearchParams({tab,view});
 if(page&&page>1)qs.set('page',String(page));
 return `/angelcare-marketplace/admin/jobkix/ops/${encodeURIComponent(workspace)}?${qs.toString()}`;
}
