import 'server-only'
import type { Data } from '@puckeditor/core'
import { createServiceClient } from '@/lib/supabase/server'
import { isStudioSourceReference } from '@/angelcare-marketplace/studio-picker/reference'
import type { StudioPickerData } from './types'

const s=(value:unknown)=>value==null?'':String(value)
export async function loadStudioPickerData(data?:Data):Promise<StudioPickerData>{
  const keys=new Set<string>(),ids=new Set<string>()
  const walk=(value:unknown)=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(walk);return}const row=value as Record<string,unknown>;const media=row.mediaAssetKey;if(typeof media==='string'&&media)keys.add(media);else if(isStudioSourceReference(media)&&media.sourceId==='media.assets')ids.add(media.entityId);Object.values(row).forEach(walk)}
  walk(data?.content||[])
  if(!keys.size&&!ids.size)return{media:[],categories:[],collections:[]}
  const db=await createServiceClient()
  const [byKey,byId]=await Promise.all([
    keys.size?db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,public_url,desktop_url,width,height,mime_type,status').in('asset_key',[...keys]):Promise.resolve({data:[]}),
    ids.size?db.from('angelcare_marketplace_media_assets').select('id,asset_key,file_name,public_url,desktop_url,width,height,mime_type,status').in('id',[...ids]):Promise.resolve({data:[]}),
  ])
  const seen=new Set<string>(),rows=[...(byKey.data||[]),...(byId.data||[])].filter((row:Record<string,unknown>)=>{const id=s(row.id);if(seen.has(id))return false;seen.add(id);return true})
  return{media:rows.map((row:Record<string,unknown>)=>({id:s(row.id),assetKey:s(row.asset_key),fileName:s(row.file_name),publicUrl:s(row.public_url||row.desktop_url),width:row.width==null?null:Number(row.width),height:row.height==null?null:Number(row.height),mimeType:s(row.mime_type),status:s(row.status)})),categories:[],collections:[]}
}
