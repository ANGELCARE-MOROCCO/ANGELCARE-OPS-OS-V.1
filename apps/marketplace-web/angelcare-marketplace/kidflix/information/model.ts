import { blankPersonal, type Personal } from '../journey/contract';
import type { Locale } from '../catalogue';
export type InformationTopic = 'about' | 'accessibility' | 'privacy';
export const ART='/kidflix/information-r1/';
export const WORLD_KEYS=['documents','printables','stories','learning','video','audio','visual-cards','presentations','assessments','activities','tools','planners','forms','community','commerce','bundles'] as const;
export const CLEAR_SECTIONS=['saved','progress','recent','collections','preferences','profile'] as const;
export type ClearSection=typeof CLEAR_SECTIONS[number];
export function clearPersonalSections(data:Personal,selected:readonly ClearSection[]):Personal {
 const next={...data},blank=blankPersonal();
 for(const section of selected) {
  if(section==='progress')next.activity=[];
  else if(section==='collections'){next.collections=[];next.queue=[];}
  else if(section==='preferences')next.preferences=blank.preferences;
  else if(section==='profile')next.profile=blank.profile;
  else next[section]=[];
 }
 return next;
}
export const progressStorageKey=(key:string)=>/^kidflix\.progress\.r1\.[a-zA-Z0-9._-]+\.(en|fr|ar)$/.test(key);
export function localPage(value:string,origin:string):string {
 if(!value.trim())return '';
 if(value.includes('\\'))throw Error('INVALID_PAGE');
 const url=new URL(value,origin);
 if(url.origin!==origin||url.username||url.password||!/^\/kidflix\/(en|fr|ar)(\/|$)/.test(url.pathname))throw Error('INVALID_PAGE');
 return url.pathname.slice(0,300);
}
export function cleanFeedback(value:unknown,origin:string) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_FEEDBACK');
 const v=value as Record<string,unknown>,clean=(s:unknown,max:number)=>typeof s==='string'?s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim().slice(0,max+1):'';
 const kind=v.kind,locale=v.locale,message=clean(v.message,4000),category=clean(v.category,60),email=clean(v.email,254);
 if(!['accessibility','privacy'].includes(String(kind))||!['en','fr','ar'].includes(String(locale))||message.length<10||message.length>4000||!category||category.length>60||v.consent!==true||v.website)throw Error('INVALID_FEEDBACK');
 if(email&&(!/^[^\s@<>"\\]+@[^\s@<>"\\]+\.[^\s@<>"\\]+$/.test(email)||email.length>254))throw Error('INVALID_FEEDBACK');
 return {kind:kind as 'accessibility'|'privacy',locale:locale as Locale,email,message,category,page:localPage(clean(v.page,1000),origin)};
}
