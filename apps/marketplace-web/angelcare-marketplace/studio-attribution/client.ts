'use client'
import { sanitizeStudioAttribution,studioAttributionForInteraction,studioAttributionFromSearch } from './context'
import type { StudioAttributionContext } from './types'

function referrer(){try{if(!document.referrer)return{};const url=new URL(document.referrer);return{referrerHost:url.host,referrerPath:url.pathname.slice(0,500)}}catch{return{}}}
export function clientStudioAttribution(base:StudioAttributionContext|undefined,input:{blockId?:string|null;interactionId?:string|null;actionId?:string|null;workflowId?:string|null;itemId?:string|null;itemSlug?:string|null;collectionId?:string|null;placementId?:string|null;campaignId?:string|null;audienceId?:string|null;territoryId?:string|null}={}):StudioAttributionContext{
  const fromSearch=studioAttributionFromSearch(window.location.search,base||{});return studioAttributionForInteraction(sanitizeStudioAttribution({...fromSearch,...referrer(),pageRoute:fromSearch.pageRoute||window.location.pathname}),{...input,traceId:fromSearch.traceId||crypto.randomUUID()})
}
export function studioAttributionEventData(attribution:StudioAttributionContext){return{studioAttribution:attribution}}
