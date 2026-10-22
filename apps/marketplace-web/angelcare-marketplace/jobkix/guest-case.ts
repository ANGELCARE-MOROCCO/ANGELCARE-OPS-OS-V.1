import { safeReturnTo } from './routes';
import { isLocale } from './contracts';
import { JobkixFault } from './contracts';
import { object,text,locale,integer } from './validation';
export function guestCasePayload(action:string,value:unknown,draft=false){
 const input=object(value);
 if(action==='case.create'){
  const kind=input.kind==='support'?'support':input.kind==='report'?'report':null;if(!kind)throw new JobkixFault('INVALID_INPUT');
  const email=text(input.email??'','email',0,320).toLowerCase(),relatedUrl=text(input.relatedUrl??'','relatedUrl',0,2000);
  if(!draft&&email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new JobkixFault('INVALID_INPUT');
  if(!draft&&relatedUrl)reportContextUrl(relatedUrl);
  return {kind,locale:locale(input.locale),category:text(input.category,'category',draft?0:1,100),description:text(input.description,'description',draft?0:10,16000),name:text(input.name??'','name',0,180),email,relatedUrl};
 }
 if(action==='case.reply'||action==='case.appeal')return {locale:locale(input.locale),description:text(input.description,'description',draft?0:10,16000)};
 throw new JobkixFault('INVALID_INPUT');
}
export type GuestCaseAction='case.create'|'case.reply'|'case.appeal';
export interface GuestIntent{action:GuestCaseAction;payload:Record<string,unknown>;version:number;key:string}
export function guestIntent(value:unknown):GuestIntent|null{if(value===null||value===undefined)return null;const row=object(value),action=row.action;if(action!=='case.create'&&action!=='case.reply'&&action!=='case.appeal')throw new JobkixFault('INVALID_INPUT');return {action,payload:guestCasePayload(action,row.payload),version:integer(row.version,'version',0,1000000),key:text(row.key,'key',16,180)};}
export function guestDraft(value:unknown){const body=object(value),fields=object(body.fields),action=typeof fields.action==='string'?fields.action:'case.create',payload=guestCasePayload(action,fields.payload,true);return {fields:{action,payload},intent:guestIntent(body.intent)};}
export function reportContextUrl(value:string){
 let url:URL;try{url=new URL(value,'https://jobkix.invalid');}catch{throw new JobkixFault('INVALID_INPUT');}
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||Array.from(url.searchParams.keys()).some(key=>/token|signature|credential|authorization|password|^code$/i.test(key)))throw new JobkixFault('INVALID_INPUT');
 if(value.startsWith('/')){const locale=url.pathname.split('/')[2];if(!isLocale(locale)||safeReturnTo(value,locale,'')!==value)throw new JobkixFault('INVALID_INPUT');}
 else if(!/^https?:\/\//.test(value))throw new JobkixFault('INVALID_INPUT');return value;
}
