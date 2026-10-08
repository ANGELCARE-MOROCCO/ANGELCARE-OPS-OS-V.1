import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { getDiscoveryItemById,searchDiscovery } from '@/angelcare-marketplace/catalog-discovery/repository'
import type { CatalogLocale,DiscoveryItem } from '@/angelcare-marketplace/catalog-discovery/types'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import type { StudioSourceEntity,StudioSourceSearchInput,StudioSourceSearchResult,StudioSourceValidation } from '@/angelcare-marketplace/studio-source-registry/types'

const text=(v:unknown)=>v==null?'':String(v)
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null
const locale=(v:unknown):CatalogLocale=>v==='en'||v==='ar'?v:'fr'
const encode=(offset:number)=>offset>0?Buffer.from(JSON.stringify({offset}),'utf8').toString('base64url'):null
const decode=(cursor:string|null|undefined)=>{if(!cursor)return 0;try{const raw=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'));return Math.max(0,Math.floor(Number(raw?.offset)||0))}catch{return 0}}

async function territoryCode(territoryId:string|null|undefined){if(!territoryId)return null;const db=await createServiceClient();const r=await db.from('angelcare_marketplace_territories').select('territory_code').eq('id',territoryId).maybeSingle();return text(r.data?.territory_code)||null}

export function discoveryStudioEntity(item:DiscoveryItem):StudioSourceEntity{return{sourceId:'catalog.items',id:item.id,title:item.name,...(item.short_description?{subtitle:item.short_description}:{}),...(item.media_url?{image:{url:item.media_url,alt:item.name}}:{}),status:'published',badges:[{label:'type',value:item.kind},{label:'availability',value:item.availability_status},...(item.category_title?[{label:'category',value:item.category_title}]:[])],canonicalRef:{sourceId:'catalog.items',entityId:item.id},metadata:{public_reference:item.public_reference,item_key:item.item_key,slug:item.slug,kind:item.kind,availability_status:item.availability_status,category_key:item.category_key,category_title:item.category_title,price_mode:item.price_mode,price_amount:item.price_amount,currency_label:item.currency_label,featured:item.featured,territory_id:item.territory_id}}}

export async function searchCanonicalCatalogForStudio(input:StudioSourceSearchInput,context:MarketplaceRequestContext):Promise<StudioSourceSearchResult>{
 const pageSize=Math.max(1,Math.min(Number(input.limit||24),48)),offset=decode(input.cursor),filters=input.filters||{},territory=await territoryCode(input.context?.territoryId??context.territoryId)
 const result=await searchDiscovery({locale:locale(input.context?.locale||context.locale),query:input.query?.trim()||undefined,territoryCode:territory,kind:typeof filters.kind==='string'&&filters.kind?filters.kind:null,category:typeof filters.category_key==='string'&&filters.category_key?filters.category_key:null,availability:typeof filters.availability_status==='string'&&filters.availability_status?filters.availability_status:null,sort:typeof filters.sort==='string'&&filters.sort?filters.sort:'recommended',limit:pageSize,offset})
 const next=offset+result.items.length
 return{sourceId:'catalog.items',items:result.items.map(discoveryStudioEntity),nextCursor:next<result.total?encode(next):null,total:result.total}
}

export async function getCanonicalCatalogStudioEntity(entityId:string,input:StudioSourceSearchInput,context:MarketplaceRequestContext){const territory=await territoryCode(input.context?.territoryId??context.territoryId);const item=await getDiscoveryItemById({locale:locale(input.context?.locale||context.locale),id:entityId,territoryCode:territory});return item?discoveryStudioEntity(item):null}

export async function validateCanonicalCatalogStudioEntity(entityId:string,input:StudioSourceSearchInput,context:MarketplaceRequestContext):Promise<StudioSourceValidation>{const reference={sourceId:'catalog.items',entityId};const entity=await getCanonicalCatalogStudioEntity(entityId,input,context);return entity?{status:'VALID',reference,entity}:{status:'NOT_FOUND',reference,reason:'Cette offre n’existe plus dans le catalogue publié ou n’est pas visible dans ce territoire.'}}

export function formatCanonicalCommerceValue(entity:StudioSourceEntity){const amount=num(entity.metadata.price_amount),currency=text(entity.metadata.currency_label)||'MAD';return amount==null?'Prix selon configuration':`${new Intl.NumberFormat('fr-MA',{maximumFractionDigits:2}).format(amount)} ${currency}`}
