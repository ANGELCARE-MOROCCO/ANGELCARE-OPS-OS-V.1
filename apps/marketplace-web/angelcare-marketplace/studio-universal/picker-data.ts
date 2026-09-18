import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { StudioPickerData } from './types'

const s=(value:unknown)=>value==null?'':String(value)
export async function loadStudioPickerData():Promise<StudioPickerData>{
  const db=await createServiceClient()
  const [media,categories,collections]=await Promise.all([
    db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,public_url,desktop_url,width,height,mime_type,status').eq('status','active').order('updated_at',{ascending:false}).limit(500),
    db.from('angelcare_marketplace_catalog_categories').select('id,category_key,name_fr,status').neq('status','archived').order('name_fr').limit(500),
    db.from('angelcare_marketplace_homepage_collections').select('id,collection_key,title,status').neq('status','archived').order('updated_at',{ascending:false}).limit(300),
  ])
  return {
    media:(media.data||[]).map((row:Record<string,unknown>)=>({id:s(row.id),assetKey:s(row.asset_key),fileName:s(row.file_name),publicUrl:s(row.public_url||row.desktop_url),width:row.width==null?null:Number(row.width),height:row.height==null?null:Number(row.height),mimeType:s(row.mime_type),status:s(row.status)})),
    categories:(categories.data||[]).map((row:Record<string,unknown>)=>({id:s(row.id),key:s(row.category_key),label:s(row.name_fr||row.category_key),status:s(row.status)})),
    collections:(collections.data||[]).map((row:Record<string,unknown>)=>({id:s(row.id),key:s(row.collection_key),label:s(row.title||row.collection_key),status:s(row.status)})),
  }
}
