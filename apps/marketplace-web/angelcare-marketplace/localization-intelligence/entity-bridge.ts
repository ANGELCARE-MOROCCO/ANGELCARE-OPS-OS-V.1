import {revalidatePath,revalidateTag} from 'next/cache'
import {createServiceClient} from '@/lib/supabase/server'

type Row=Record<string,unknown>
const BRIDGE:Record<string,Record<string,string>>={
 angelcare_marketplace_catalog_items:{name_fr:'name',short_description_fr:'short_description',description_fr:'description'},
 angelcare_marketplace_catalog_item_media:{alt_text_fr:'alt_text'},
 angelcare_marketplace_catalog_variants:{name_fr:'name'},
 angelcare_marketplace_catalog_attribute_definitions:{name_fr:'name'},
 angelcare_marketplace_media_assets:{alt_text_fr:'alt_text',title_fr:'title',caption_fr:'caption'},
 angelcare_marketplace_partner_plans:{name_fr:'name',description_fr:'description'},
 angelcare_marketplace_wallet_policies:{name_fr:'name'},
 angelcare_marketplace_wallet_tiers:{name_fr:'name'},
}
const text=(value:unknown)=>typeof value==='string'?value.trim():''
function setJsonPath(value:unknown,path:string[],translation:string){const root=value&&typeof value==='object'&&!Array.isArray(value)?structuredClone(value as Row):{};let cursor=root;for(const segment of path.slice(0,-1)){const next=cursor[segment];cursor[segment]=next&&typeof next==='object'&&!Array.isArray(next)?structuredClone(next as Row):{};cursor=cursor[segment] as Row}cursor[path.at(-1)!]=translation;return root}
async function bridgeExistingLocaleRow(candidate:Row,locale:'en'|'ar',translation:string){
 const evidence=(candidate.discovery_evidence||{})as Row;if(text(evidence.localeAuthority)!=='locale_row')return null
 const table=text(candidate.database_table),rowId=text(candidate.database_row_id),field=text(candidate.database_field),identityFields=Array.isArray(evidence.identityFields)?evidence.identityFields.map(String):[]
 if(!table||!rowId||!field||!identityFields.length)return null
 const db=await createServiceClient(),{data:source,error:sourceError}=await db.from(table).select('*').eq('id',rowId).maybeSingle();if(sourceError||!source)return null
 let query=db.from(table).select('*').eq('locale',locale).limit(1)
 for(const identityField of identityFields){const value=(source as Row)[identityField];query=value==null?query.is(identityField,null):query.eq(identityField,value as never)}
 const{data:target,error:targetError}=await query.maybeSingle();if(targetError||!target)return null
 const [rootField,...path]=field.split('.');const patch:Row=path.length?{[rootField]:setJsonPath((target as Row)[rootField]??(source as Row)[rootField],path,translation)}:{[rootField]:translation};patch.updated_at=new Date().toISOString()
 const{error}=await db.from(table).update(patch).eq('id',(target as Row).id as never);if(error)throw new Error(`Entity locale bridge failed for ${table}.${field}: ${error.message}`)
 return{bridged:true,table,rowId:String((target as Row).id),targetField:field,authority:'existing_locale_row'}
}
export async function bridgePublishedEntityTranslation(candidate:Row,locale:'en'|'ar',translation:string){
 const table=text(candidate.database_table),sourceField=text(candidate.database_field),rowId=text(candidate.database_row_id),base=BRIDGE[table]?.[sourceField],route=text(candidate.route)
 let result:Row={bridged:false,reason:'generic_runtime_authority'}
 const localeRow=await bridgeExistingLocaleRow(candidate,locale,translation)
 if(localeRow)result=localeRow
 else if(base&&rowId){const targetField=`${base}_${locale}`,db=await createServiceClient(),{error}=await db.from(table).update({[targetField]:translation,updated_at:new Date().toISOString()}).eq('id',rowId);if(error)throw new Error(`Entity localization bridge failed for ${table}.${targetField}: ${error.message}`);result={bridged:true,table,rowId,targetField}}
 revalidateTag('marketplace-localization-runtime','max');revalidatePath('/angelcare-marketplace','layout');if(route){revalidatePath(route);if(route.includes('/fr')){revalidatePath(route.replace('/fr','/en'));revalidatePath(route.replace('/fr','/ar'))}}
 return result
}
