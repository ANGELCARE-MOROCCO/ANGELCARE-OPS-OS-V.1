import type { StudioActionReference } from './types'
export function isStudioActionReference(value:unknown):value is StudioActionReference{return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&Number((value as any).version)===1&&typeof (value as any).actionId==='string')}
export function normalizeStudioActionReference(value:unknown,legacyHref?:unknown):StudioActionReference|null{
  if(isStudioActionReference(value))return value
  const href=typeof legacyHref==='string'?legacyHref.trim():''
  if(href)return{version:1,actionId:'external.open',externalUrl:href,newWindow:false}
  return null
}
export function safeExternalStudioUrl(value:unknown){const raw=typeof value==='string'?value.trim():'';if(!raw)return null;try{if(/^mailto:|^tel:/i.test(raw))return raw;const url=new URL(raw);return ['http:','https:'].includes(url.protocol)?raw:null}catch{return null}}
