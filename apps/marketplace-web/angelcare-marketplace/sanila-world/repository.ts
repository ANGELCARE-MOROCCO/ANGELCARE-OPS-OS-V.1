import 'server-only'
import type { Data } from '@puckeditor/core'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import type { SanilaWorldState } from '../sanila-admin/types'
import { SANILA_WORLD_CONFIG_KEY } from './contract'
import { applySanilaWorldAction, normalizeSanilaState, sanilaSourceState } from './world-engine'

type Action=Parameters<typeof applySanilaWorldAction>[1]
export class SanilaWorldConflict extends Error {constructor(){super('SANILA_VERSION_CONFLICT : un autre opérateur a modifié le monde public. Actualisez avant de réessayer.')}}

export async function getSanilaWorldState():Promise<SanilaWorldState>{
  const db=await createServiceClient()
  const {data,error}=await db.from('angelcare_marketplace_configurations').select('value')
    .eq('config_key',SANILA_WORLD_CONFIG_KEY).is('territory_id',null).is('tenant_id',null).is('locale',null).maybeSingle()
  if(error)throw error
  return data?normalizeSanilaState(data.value):sanilaSourceState()
}

export async function mutateSanilaWorld({action,payload={},context,expectedRevision}:{action:Action;payload?:Record<string,unknown>;context:MarketplaceRequestContext;expectedRevision:number}){
  const db=await createServiceClient()
  const {data:existing,error:readError}=await db.from('angelcare_marketplace_configurations').select('id,version,value')
    .eq('config_key',SANILA_WORLD_CONFIG_KEY).is('territory_id',null).is('tenant_id',null).is('locale',null).maybeSingle()
  if(readError)throw readError
  const current=existing?normalizeSanilaState(existing.value):sanilaSourceState()
  if(!Number.isInteger(expectedRevision)||expectedRevision!==current.revision)throw new SanilaWorldConflict()
  const next=applySanilaWorldAction(current,action,payload,context.actor.id,new Date().toISOString())
  if(action==='publish'||action==='import_bundle'){
    const refs=new Set<string>()
    for(const p of Object.values(next.pages)){
      if(p.deletedAt)continue
      const document=action==='publish'?p.publishedData:p.data
      if(!document)continue
      for(const item of document.content){
        if(item.type!=='SanilaImage')continue
        const raw=String(item.props?.src||'')
        const match=/^\/api\/angelcare-marketplace\/media\/([a-f0-9-]{36})(?:\/|$)/i.exec(raw)
        if(match)refs.add(match[1])
        else if(!raw.startsWith('/sanila/'))throw new Error('Asset non natif sur la page '+p.slug)
      }
    }
    if(refs.size){
      const ids=[...refs]
      const {data:assets,error}=await db.from('angelcare_marketplace_media_assets').select('id,status').in('id',ids)
      if(error)throw error
      const active=new Set((assets||[]).filter(r=>r.status==='active').map(r=>r.id))
      for(const id of ids)if(!active.has(id))throw new Error('Asset SANILA manquant, inactif ou non approuvé : '+id)
    }
  }
  if(existing){
    const {data:updated,error}=await db.from('angelcare_marketplace_configurations').update({
      value:next,version:Number(existing.version||1)+1,updated_by:context.actor.id,updated_at:new Date().toISOString()
    }).eq('id',existing.id).eq('version',existing.version).select('id').maybeSingle()
    if(error)throw error
    if(!updated)throw new SanilaWorldConflict()
  }else{
    const {error}=await db.from('angelcare_marketplace_configurations').insert({
      config_key:SANILA_WORLD_CONFIG_KEY,label:'SANILA Sovereign Public World',
      description:'Public documents, themes, releases and native import for SANILA.',
      value:next,value_type:'json',category:'SANILA Sovereign World',
      editable:true,sensitive:false,territory_id:null,tenant_id:null,locale:null,
      version:1,updated_by:context.actor.id
    })
    if(error)throw error
  }
  const verified=await getSanilaWorldState()
  if(verified.revision!==next.revision)throw new SanilaWorldConflict()
  return verified
}
export async function saveSanilaWorldPage(input:{slug:string;data:Data;context:MarketplaceRequestContext;expectedRevision?:number}){
  return mutateSanilaWorld({action:'save_page',payload:{slug:input.slug,data:input.data},context:input.context,
    expectedRevision:input.expectedRevision??(await getSanilaWorldState()).revision})
}
export async function publishSanilaWorld(context:MarketplaceRequestContext,expectedRevision?:number){
  return mutateSanilaWorld({action:'publish',context,expectedRevision:expectedRevision??(await getSanilaWorldState()).revision})
}
export async function saveSanilaWorldImport(input:{packageName:string;fingerprint:string;context:MarketplaceRequestContext}):Promise<never>{
  void input
  throw new Error('L’ancien import ne stockait que le nom du ZIP. Utilisez le nouveau manifeste SANILA v1.')
}
