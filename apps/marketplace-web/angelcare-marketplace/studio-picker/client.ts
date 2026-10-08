'use client'

import type { StudioSourceDescriptor, StudioSourceEntity, StudioSourceReference, StudioSourceSearchResult, StudioSourceValidation } from '@/angelcare-marketplace/studio-source-registry/types'
import type { PickerApiEnvelope, UniversalPickerContext, UniversalPickerFilter } from './types'

const ROOT='/api/angelcare-marketplace/cms/studio/sources'

export class StudioPickerApiError extends Error{
  code?:string
  requestId?:string
  status:number
  constructor(message:string,status:number,code?:string,requestId?:string){super(message);this.name='StudioPickerApiError';this.status=status;this.code=code;this.requestId=requestId}
}

async function request<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,headers:{Accept:'application/json',...(init?.headers||{})}})
  let body:PickerApiEnvelope<T>={}
  try{body=await response.json() as PickerApiEnvelope<T>}catch{}
  if(!response.ok||body.error)throw new StudioPickerApiError(body.error?.message||'Impossible de charger cette ressource Marketplace.',response.status,body.error?.code,body.requestId)
  return body.data as T
}

function qs(input:{query?:string;limit?:number;cursor?:string|null;context?:UniversalPickerContext;filters?:UniversalPickerFilter[]}){
  const params=new URLSearchParams()
  if(input.query?.trim())params.set('q',input.query.trim().slice(0,120))
  params.set('limit',String(Math.max(1,Math.min(input.limit||24,50))))
  if(input.cursor)params.set('cursor',input.cursor)
  if(input.context?.locale)params.set('locale',input.context.locale)
  if(input.context?.territoryId)params.set('territoryId',input.context.territoryId)
  if(input.context?.audienceId)params.set('audienceId',input.context.audienceId)
  for(const filter of input.filters||[]){if(filter.value)params.set(`filter.${filter.key}`,filter.value)}
  return params.toString()
}

export async function listPickerSources(signal?:AbortSignal){return request<{sources:StudioSourceDescriptor[]}>(ROOT,{signal})}
export async function getPickerSource(sourceId:string,signal?:AbortSignal){return request<StudioSourceDescriptor>(`${ROOT}/${encodeURIComponent(sourceId)}`,{signal})}
export async function searchPickerSource(sourceId:string,input:{query?:string;limit?:number;cursor?:string|null;context?:UniversalPickerContext;filters?:UniversalPickerFilter[];browse?:boolean},signal?:AbortSignal){
  const op=input.browse?'browse':'search'
  return request<StudioSourceSearchResult>(`${ROOT}/${encodeURIComponent(sourceId)}/${op}?${qs(input)}`,{signal})
}
export async function getPickerEntity(reference:StudioSourceReference,context?:UniversalPickerContext,signal?:AbortSignal){
  const suffix=qs({limit:1,context})
  return request<StudioSourceEntity>(`${ROOT}/${encodeURIComponent(reference.sourceId)}/entities/${encodeURIComponent(reference.entityId)}?${suffix}`,{signal})
}
export async function validatePickerReference(reference:StudioSourceReference,signal?:AbortSignal){
  return request<StudioSourceValidation>(`${ROOT}/${encodeURIComponent(reference.sourceId)}/validate`,{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({entityId:reference.entityId})})
}
