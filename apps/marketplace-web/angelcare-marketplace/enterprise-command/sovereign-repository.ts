import { randomUUID } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { segmentPreview } from './repository'

export type WorkspaceItem = {
  id?: string
  title: string
  reference: string
  route: string
  kind: string
  subtitle?: string
  status?: string
  updatedAt?: string | null
}

export type OperatorWorkspaceState = {
  workspaceKey: string
  pins: WorkspaceItem[]
  recents: WorkspaceItem[]
  layout: Record<string, unknown>
  savedViews: Array<Record<string, unknown>>
  updatedAt: string | null
}

export type SavedSegmentRecord = {
  id: string
  public_reference: string
  name: string
  description: string | null
  filters: Record<string, unknown>
  last_snapshot_count: number
  last_snapshot_at: string | null
  status: string
  created_at: string
  updated_at: string
}

type Row = Record<string, unknown>
const text=(v:unknown)=>String(v??'').trim()
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const rows=(v:unknown):Row[]=>Array.isArray(v)?v.filter((x):x is Row=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x)):[]
const uniq=(items:WorkspaceItem[])=>items.filter((item,index,list)=>Boolean(item.route)&&list.findIndex(candidate=>candidate.route===item.route)===index).slice(0,40)

function workspaceFrom(row:Row|null,workspaceKey:string):OperatorWorkspaceState{
  return {
    workspaceKey,
    pins:uniq(rows(row?.pins).map(item=>({id:text(item.id)||undefined,title:text(item.title),reference:text(item.reference),route:text(item.route),kind:text(item.kind)||'workspace',subtitle:text(item.subtitle)||undefined,status:text(item.status)||undefined,updatedAt:text(item.updatedAt)||null}))),
    recents:uniq(rows(row?.recents).map(item=>({id:text(item.id)||undefined,title:text(item.title),reference:text(item.reference),route:text(item.route),kind:text(item.kind)||'workspace',subtitle:text(item.subtitle)||undefined,status:text(item.status)||undefined,updatedAt:text(item.updatedAt)||null}))),
    layout:obj(row?.layout),
    savedViews:rows(row?.saved_views),
    updatedAt:row?.updated_at?text(row.updated_at):null,
  }
}

export async function operatorWorkspace(context:MarketplaceRequestContext,workspaceKey='primary'):Promise<OperatorWorkspaceState>{
  const db=await createServiceClient()
  const {data,error}=await db.from('angelcare_marketplace_operator_workspaces').select('*').eq('app_user_id',context.actor.id).eq('workspace_key',workspaceKey).maybeSingle()
  if(error){ if(error.code==='42P01')return workspaceFrom(null,workspaceKey); throw new MarketplaceError('INTERNAL_ERROR','Workspace opérateur indisponible.') }
  return workspaceFrom((data||null) as Row|null,workspaceKey)
}

export async function mutateOperatorWorkspace(input:{context:MarketplaceRequestContext;workspaceKey?:string;body:Record<string,unknown>;request?:Request}){
  const workspaceKey=text(input.workspaceKey)||'primary'
  const current=await operatorWorkspace(input.context,workspaceKey)
  const action=text(input.body.action)
  const item=obj(input.body.item) as WorkspaceItem
  let pins=[...current.pins],recents=[...current.recents],layout=current.layout,savedViews=current.savedViews
  const normalized:WorkspaceItem={id:text(item.id)||undefined,title:text(item.title),reference:text(item.reference),route:text(item.route),kind:text(item.kind)||'workspace',subtitle:text(item.subtitle)||undefined,status:text(item.status)||undefined,updatedAt:text(item.updatedAt)||null}
  if(action==='pin'&&normalized.route)pins=uniq([normalized,...pins])
  else if(action==='unpin')pins=pins.filter(candidate=>candidate.route!==text(input.body.route))
  else if(action==='remember'&&normalized.route)recents=uniq([normalized,...recents]).slice(0,24)
  else if(action==='replace_pins')pins=uniq(rows(input.body.pins) as unknown as WorkspaceItem[])
  else if(action==='layout')layout=obj(input.body.layout)
  else if(action==='saved_views')savedViews=rows(input.body.savedViews)
  else if(action==='clear_recents')recents=[]
  else if(!action)throw new MarketplaceError('VALIDATION_ERROR','Action workspace requise.')
  const db=await createServiceClient()
  const now=new Date().toISOString()
  const record={app_user_id:input.context.actor.id,workspace_key:workspaceKey,pins,recents,layout,saved_views:savedViews,updated_at:now}
  const {data,error}=await db.from('angelcare_marketplace_operator_workspaces').upsert(record,{onConflict:'app_user_id,workspace_key'}).select('*').single()
  if(error||!data)throw new MarketplaceError('INTERNAL_ERROR','Impossible de persister le workspace opérateur.')
  await writeMarketplaceAudit({context:input.context,requestId:randomUUID(),action:`marketplace.operator_workspace.${action}`,objectType:'operator_workspace',objectId:text(data.id),result:'success',severity:'info',afterValue:{workspaceKey,action},source:'sovereign-enterprise-admin',request:input.request})
  return workspaceFrom(data as Row,workspaceKey)
}

export async function listSavedSegments(context:MarketplaceRequestContext):Promise<SavedSegmentRecord[]>{
  const db=await createServiceClient()
  const {data,error}=await db.from('angelcare_marketplace_saved_segments').select('*').eq('app_user_id',context.actor.id).neq('status','archived').order('updated_at',{ascending:false})
  if(error){if(error.code==='42P01')return[];throw new MarketplaceError('INTERNAL_ERROR','Segments enregistrés indisponibles.')}
  return rows(data).map(row=>({id:text(row.id),public_reference:text(row.public_reference),name:text(row.name),description:text(row.description)||null,filters:obj(row.filters),last_snapshot_count:Number(row.last_snapshot_count||0),last_snapshot_at:text(row.last_snapshot_at)||null,status:text(row.status)||'active',created_at:text(row.created_at),updated_at:text(row.updated_at)}))
}

export async function saveSegment(input:{context:MarketplaceRequestContext;body:Record<string,unknown>;request?:Request}){
  const name=text(input.body.name)
  if(!name)throw new MarketplaceError('VALIDATION_ERROR','Nom du segment requis.')
  const filters=obj(input.body.filters)
  const snapshot=await segmentPreview(filters)
  const db=await createServiceClient();const now=new Date().toISOString()
  const payload={app_user_id:input.context.actor.id,name,description:text(input.body.description)||null,filters,last_snapshot_count:snapshot.total,last_snapshot_at:now,status:'active',updated_at:now}
  const id=text(input.body.id)
  const result=id?await db.from('angelcare_marketplace_saved_segments').update(payload).eq('id',id).eq('app_user_id',input.context.actor.id).select('*').single():await db.from('angelcare_marketplace_saved_segments').insert({...payload,created_by:input.context.actor.id}).select('*').single()
  if(result.error||!result.data)throw new MarketplaceError('INTERNAL_ERROR','Impossible d’enregistrer le segment.')
  const segmentId=text(result.data.id)
  try{
    await db.from('angelcare_marketplace_segment_memberships').delete().eq('segment_id',segmentId)
    const memberships=snapshot.customers.map(customer=>({segment_id:segmentId,customer_account_id:customer.id,snapshot:customer,matched_at:now}))
    for(let index=0;index<memberships.length;index+=500){const batch=memberships.slice(index,index+500);if(batch.length)await db.from('angelcare_marketplace_segment_memberships').insert(batch)}
  }catch{/* additive compatibility until final corrective SQL is applied */}
  await writeMarketplaceAudit({context:input.context,requestId:randomUUID(),action:id?'marketplace.segment.updated':'marketplace.segment.created',objectType:'saved_segment',objectId:segmentId,result:'success',severity:'info',afterValue:{name,filters,count:snapshot.total,evaluated:snapshot.evaluated},source:'final-10-10-corrective',request:input.request})
  return {segment:result.data,snapshot}
}

export async function deleteSegment(input:{context:MarketplaceRequestContext;segmentId:string;request?:Request}){
  const db=await createServiceClient();const now=new Date().toISOString()
  const {data,error}=await db.from('angelcare_marketplace_saved_segments').update({status:'archived',updated_at:now}).eq('id',input.segmentId).eq('app_user_id',input.context.actor.id).select('*').single()
  if(error||!data)throw new MarketplaceError('NOT_FOUND','Segment introuvable.')
  await writeMarketplaceAudit({context:input.context,requestId:randomUUID(),action:'marketplace.segment.archived',objectType:'saved_segment',objectId:input.segmentId,result:'success',severity:'info',source:'sovereign-enterprise-admin',request:input.request})
  return data
}

export async function operateOrder(input:{context:MarketplaceRequestContext;orderId:string;body:Record<string,unknown>;request?:Request}){
  const db=await createServiceClient()
  const beforeResult=await db.from('angelcare_marketplace_journeys').select('*').eq('id',input.orderId).single()
  if(beforeResult.error||!beforeResult.data)throw new MarketplaceError('NOT_FOUND','Commande introuvable.')
  const before=beforeResult.data as Row
  const payload:Row={updated_at:new Date().toISOString()}
  if(input.body.scheduledStartAt!==undefined)payload.scheduled_start_at=text(input.body.scheduledStartAt)||null
  if(input.body.scheduledEndAt!==undefined)payload.scheduled_end_at=text(input.body.scheduledEndAt)||null
  if(input.body.nextActionLabel!==undefined)payload.next_action_label=text(input.body.nextActionLabel)||null
  if(input.body.nextActionDueAt!==undefined)payload.next_action_due_at=text(input.body.nextActionDueAt)||null
  if(input.body.territoryId!==undefined)payload.territory_id=text(input.body.territoryId)||null
  if(input.body.title!==undefined)payload.title=text(input.body.title)
  if(input.body.providerName!==undefined||input.body.providerId!==undefined||input.body.fulfillmentStatus!==undefined||input.body.serviceAddressId!==undefined){
    const current=obj(before.fulfillment_status)
    let serviceAddress:Row|null=null
    if(input.body.serviceAddressId){
      const addressResult=await db.from('angelcare_marketplace_customer_addresses').select('*').eq('id',text(input.body.serviceAddressId)).maybeSingle()
      if(addressResult.data)serviceAddress=addressResult.data as Row
    }
    payload.fulfillment_status={...current,
      provider_id:text(input.body.providerId)||current.provider_id||null,
      provider_name:text(input.body.providerName)||current.provider_name||null,
      provider_snapshot:obj(input.body.providerSnapshot),
      service_address_id:text(input.body.serviceAddressId)||current.service_address_id||null,
      service_address:serviceAddress||current.service_address||null,
      status:text(input.body.fulfillmentStatus)||current.status||text(before.status),
      assigned_at:input.body.providerId||input.body.providerName?new Date().toISOString():current.assigned_at||null}
  }
  const keys=Object.keys(payload).filter(key=>key!=='updated_at')
  if(!keys.length)throw new MarketplaceError('VALIDATION_ERROR','Aucune modification opérationnelle fournie.')
  const {data,error}=await db.from('angelcare_marketplace_journeys').update(payload).eq('id',input.orderId).select('*').single()
  if(error||!data)throw new MarketplaceError('INTERNAL_ERROR','Modification opérationnelle impossible.')
  await db.from('angelcare_marketplace_journey_events').insert({journey_id:input.orderId,event_key:'sovereign_operator_update',title:'Commande opérée depuis le Command OS',description:text(input.body.reason)||'Mise à jour opérateur',status:text(data.status),authority_type:'admin',evidence:{before:Object.fromEntries(keys.map(key=>[key,before[key]])),after:Object.fromEntries(keys.map(key=>[key,data[key]]))},customer_visible:false,occurred_at:new Date().toISOString(),created_by:input.context.actor.id}).then(()=>null,()=>null)
  await writeMarketplaceAudit({context:input.context,requestId:randomUUID(),action:'marketplace.order.sovereign_operated',objectType:'marketplace_journey',objectId:input.orderId,result:'success',severity:'info',beforeValue:before,afterValue:data,reason:text(input.body.reason)||'Command OS',source:'sovereign-enterprise-admin',request:input.request})
  return data
}
