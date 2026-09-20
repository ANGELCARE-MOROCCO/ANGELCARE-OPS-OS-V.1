import 'server-only'
import { createHash } from 'crypto'
import { sanitizeStudioAttribution } from './context'
import type { StudioAttributionContext } from './types'
export function serverStudioAttribution(value:unknown,request?:Request,visitorReference?:string|null):StudioAttributionContext{
  const extra:Record<string,unknown>={}
  const ref=request?.headers.get('referer');if(ref){try{const url=new URL(ref);extra.referrerHost=url.host;extra.referrerPath=url.pathname.slice(0,500)}catch{}}
  if(visitorReference)extra.visitorHash=createHash('sha256').update(visitorReference).digest('hex')
  return sanitizeStudioAttribution({...((value&&typeof value==='object'&&!Array.isArray(value))?value as Record<string,unknown>:{}),...extra})
}
