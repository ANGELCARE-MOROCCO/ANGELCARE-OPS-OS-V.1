import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import type { StudioSourceAdapter, StudioSourceEntity, StudioSourceSearchInput, StudioSourceSearchResult } from '../types'

type Row = Record<string, unknown>
type ScopeMode = 'none' | 'context' | 'context_or_global' | 'actor'

type TableSourceConfig = {
  sourceId: string
  table: string
  idField?: string
  titleFields: string[]
  subtitleFields?: string[]
  imageFields?: string[]
  imageAltFields?: string[]
  statusField?: string
  searchFields: string[]
  metadataFields?: string[]
  badgeFields?: string[]
  filterFields?: string[]
  fixedEq?: Record<string, string | boolean>
  fixedNeq?: Record<string, string | boolean>
  scope?: ScopeMode
  tenantField?: string
  territoryField?: string
  actorField?: string
  localeField?: string
  audienceField?: string
  audienceGlobal?: boolean
  orderField?: string
  ascending?: boolean
  normalize?: (row: Row) => Partial<StudioSourceEntity>
}

const text = (value: unknown) => value == null ? '' : String(value)
const first = (row: Row, fields: string[] = []) => fields.map((field) => text(row[field]).trim()).find(Boolean) || ''
const positiveInt = (value: unknown, fallback: number, max: number) => { const n=Number(value); return Number.isFinite(n)&&n>0?Math.min(Math.floor(n),max):fallback }
const cursorOffset = (cursor?: string | null) => { if(!cursor)return 0; try{const decoded=Buffer.from(cursor,'base64url').toString('utf8');const n=Number(decoded);return Number.isFinite(n)&&n>=0?Math.floor(n):0}catch{return 0} }
const nextCursor = (offset:number,count:number,limit:number) => count<limit?null:Buffer.from(String(offset+count),'utf8').toString('base64url')
const safeTerm = (value?:string) => String(value||'').replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim().slice(0,100)
const unique = <T,>(values:T[]) => [...new Set(values)]

function projection(config:TableSourceConfig){
  return unique([
    config.idField||'id',
    ...config.titleFields,
    ...(config.subtitleFields||[]),
    ...(config.imageFields||[]),
    ...(config.imageAltFields||[]),
    ...(config.statusField?[config.statusField]:[]),
    ...(config.metadataFields||[]),
    ...(config.badgeFields||[]),
  ]).join(',')
}

function mapRow(config: TableSourceConfig, row: Row): StudioSourceEntity {
  const id=text(row[config.idField||'id'])
  const title=first(row,config.titleFields)||id
  const subtitle=first(row,config.subtitleFields)
  const imageUrl=first(row,config.imageFields)
  const imageAlt=first(row,config.imageAltFields)||title
  const status=config.statusField?text(row[config.statusField]):''
  const metadata=Object.fromEntries((config.metadataFields||[]).filter((key)=>row[key]!==undefined).map((key)=>[key,row[key]]))
  const badges=(config.badgeFields||[]).filter((key)=>row[key]!==undefined&&row[key]!==null&&text(row[key])!=='').map((key)=>({label:key,value:Array.isArray(row[key])?(row[key] as unknown[]).map(text).join(', '):text(row[key])}))
  const base:StudioSourceEntity={sourceId:config.sourceId,id,title,...(subtitle?{subtitle}:{}),...(imageUrl?{image:{url:imageUrl,alt:imageAlt}}:{}),...(status?{status}:{}),badges,canonicalRef:{sourceId:config.sourceId,entityId:id},metadata}
  return {...base,...(config.normalize?.(row)||{}),sourceId:config.sourceId,id,canonicalRef:{sourceId:config.sourceId,entityId:id}}
}

async function queryRows(config:TableSourceConfig,input:StudioSourceSearchInput,context:MarketplaceRequestContext,entityId?:string):Promise<{rows:Row[];total?:number;offset:number;limit:number}>{
  const db=await createServiceClient()
  const limit=positiveInt(input.limit,24,50)
  const offset=cursorOffset(input.cursor)
  let q:any=db.from(config.table).select(projection(config),{count:'exact'})
  if(entityId)q=q.eq(config.idField||'id',entityId)
  for(const [field,value] of Object.entries(config.fixedEq||{}))q=q.eq(field,value)
  for(const [field,value] of Object.entries(config.fixedNeq||{}))q=q.neq(field,value)
  if(config.scope==='actor')q=q.eq(config.actorField||'app_user_id',context.actor.id)
  const territoryId=input.context?.territoryId??context.territoryId
  if(config.scope==='context'||config.scope==='context_or_global'){
    if(context.tenantId&&config.tenantField)q=q.eq(config.tenantField,context.tenantId)
    if(territoryId&&config.territoryField){
      q=config.scope==='context_or_global'?q.or(`${config.territoryField}.is.null,${config.territoryField}.eq.${territoryId}`):q.eq(config.territoryField,territoryId)
    }else if(config.scope==='context'&&config.territoryField&&!context.tenantId){
      q=q.is(config.territoryField,null)
    }
  }
  if(config.localeField){q=q.eq(config.localeField,input.context?.locale||context.locale)}
  if(config.audienceField&&input.context?.audienceId){
    q=config.audienceGlobal?q.or(`${config.audienceField}.is.null,${config.audienceField}.eq.${input.context.audienceId}`):q.eq(config.audienceField,input.context.audienceId)
  }
  for(const [field,value] of Object.entries(input.filters||{})){
    if(!(config.filterFields||[]).includes(field))throw new MarketplaceError('VALIDATION_ERROR',`Filtre non autorisé pour ${config.sourceId}: ${field}.`)
    q=value===null?q.is(field,null):q.eq(field,value)
  }
  const term=safeTerm(input.query)
  if(term&&config.searchFields.length){const clauses=config.searchFields.map((field)=>`${field}.ilike.%${term}%`).join(',');q=q.or(clauses)}
  if(config.orderField)q=q.order(config.orderField,{ascending:config.ascending===true})
  if(entityId)q=q.limit(1);else q=q.range(offset,offset+limit-1)
  const {data,error,count}=await q
  if(error)throw new MarketplaceError('INTERNAL_ERROR',`Impossible de charger la source Studio ${config.sourceId}.`,{cause:error})
  return {rows:Array.isArray(data)?data as Row[]:[],total:typeof count==='number'?count:undefined,offset,limit}
}

export function tableSourceAdapter(config: TableSourceConfig): StudioSourceAdapter {
  return {
    sourceId:config.sourceId,
    async search(input,context){const result=await queryRows(config,input,context);return{sourceId:config.sourceId,items:result.rows.map((row)=>mapRow(config,row)),nextCursor:nextCursor(result.offset,result.rows.length,result.limit),total:result.total}},
    async browse(input,context){const result=await queryRows(config,{...input,query:undefined},context);return{sourceId:config.sourceId,items:result.rows.map((row)=>mapRow(config,row)),nextCursor:nextCursor(result.offset,result.rows.length,result.limit),total:result.total}},
    async getById(entityId,input,context){const result=await queryRows(config,{...input,limit:1,cursor:null},context,entityId);return result.rows[0]?mapRow(config,result.rows[0]):null},
  }
}
