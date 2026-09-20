'use client'
import type { MouseEvent,ReactNode } from 'react'
import type { StudioResolvedAction } from '../types'
import type { StudioAttributionContext } from '@/angelcare-marketplace/studio-attribution/types'
import { withStudioAttributionHref } from '@/angelcare-marketplace/studio-attribution/context'
import { clientStudioAttribution,studioAttributionEventData } from '@/angelcare-marketplace/studio-attribution/client'

export function StudioActionLink({action,className,children,attribution,interactionId}:{action?:StudioResolvedAction|null;className?:string;children:ReactNode;attribution?:StudioAttributionContext;interactionId?:string}){
  if(!action?.href||!['READY','CONTEXT_REQUIRED'].includes(action.status))return <span className={className} aria-disabled="true" data-ac-action-status={action?.status||'UNRESOLVED'}>{children}</span>
  const external=action.external||Boolean(action.newWindow)
  function track(event:MouseEvent<HTMLAnchorElement>){
    if(!attribution)return
    const target=action!.target;const targetAttribution=target?.sourceId==='catalog.items'?{itemId:target.entityId}:target?.sourceId==='catalog.collections'?{collectionId:target.entityId}:{};const effective=clientStudioAttribution(attribution,{interactionId:interactionId||'action',actionId:action!.actionId,...targetAttribution})
    if(!external&&action!.href?.startsWith('/'))event.currentTarget.href=withStudioAttributionHref(action!.href,effective)
    void fetch('/api/angelcare-marketplace/public/events',{method:'POST',headers:{'content-type':'application/json'},keepalive:true,body:JSON.stringify({eventName:'studio_action_clicked',route:window.location.pathname,locale:effective.locale,territoryCode:null,data:{...studioAttributionEventData(effective),actionId:action!.actionId,target:action!.target||null}})}).catch(()=>undefined)
  }
  return <a className={className} href={action.href} onClick={track} target={external?'_blank':undefined} rel={external?'noreferrer noopener':undefined} data-ac-action={action.actionId} data-ac-action-status={action.status} data-ac-attribution={attribution?'enabled':'none'}>{children}</a>
}
