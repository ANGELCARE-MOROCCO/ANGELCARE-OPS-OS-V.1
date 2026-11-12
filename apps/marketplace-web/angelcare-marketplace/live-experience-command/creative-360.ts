import {createServiceClient} from '@/lib/supabase/server'
import {MarketplaceError} from '../server/errors'
import type {MarketplaceRequestContext} from '../domain/types'
import type {LivePreset,LiveTheme} from './types'
type Row=Record<string,unknown>
const obj=(x:unknown):Row=>x&&typeof x==='object'&&!Array.isArray(x)?x as Row:{}
const text=(x:unknown)=>typeof x==='string'?x:''
function error(operation:string,reason:{message?:string}|null){return new MarketplaceError('INTERNAL_ERROR','Creative Studio: '+operation+' impossible.',{cause:reason||undefined})}
export type CreativeRecord=Row&{id:string;kind:'popup'|'broadcast'|'proof';status:string;row_version:number;deleted_at?:string|null;is_system:boolean}
export async function listCustomCreatives(){
 const db=await createServiceClient()
 const [themes,presets]=await Promise.all([
  db.from('angelcare_marketplace_live_experience_themes').select('*').eq('is_system',false).order('updated_at',{ascending:false}).limit(1000),
  db.from('angelcare_marketplace_live_experience_presets').select('*').eq('is_system',false).order('updated_at',{ascending:false}).limit(1000)
 ])
 if(themes.error)throw error('charger les thèmes',themes.error)
 if(presets.error)throw error('charger les compositions',presets.error)
 return{themes:(themes.data||[]) as CreativeRecord[],presets:(presets.data||[]) as CreativeRecord[]}
}
export async function activeCustomCreatives():Promise<{themes:LiveTheme[];presets:LivePreset[]}>{
 const db=await createServiceClient()
 const [themes,presets]=await Promise.all([
  db.from('angelcare_marketplace_live_experience_themes').select('theme_key,kind,name,tokens').eq('is_system',false).eq('status','active').is('deleted_at',null).limit(1000),
  db.from('angelcare_marketplace_live_experience_presets').select('preset_key,kind,name,purpose_key,theme_key,configuration').eq('is_system',false).eq('status','active').is('deleted_at',null).limit(1000)
 ])
 if(themes.error)throw error('charger les thèmes actifs',themes.error)
 if(presets.error)throw error('charger les presets actifs',presets.error)
 return{
  themes:(themes.data||[]).map((r:Row)=>({key:text(r.theme_key),kind:text(r.kind) as LiveTheme['kind'],name:obj(r.name) as unknown as LiveTheme['name'],tokens:obj(r.tokens) as LiveTheme['tokens']})),
  presets:(presets.data||[]).map((r:Row)=>({key:text(r.preset_key),kind:text(r.kind) as LivePreset['kind'],name:obj(r.name) as unknown as LivePreset['name'],purposeKey:text(r.purpose_key),themeKey:text(r.theme_key),configuration:obj(r.configuration)}))
 }
}
export async function liveCreativeCommand(type:'theme'|'preset',action:string,payload:Row,context:MarketplaceRequestContext){
 if(!['create','update','duplicate','activate','pause','archive','trash','restore'].includes(action))throw new MarketplaceError('VALIDATION_ERROR','Commande de création inconnue.')
 const db=await createServiceClient()
 const {data,error:dbError}=await db.rpc('ac_live_creative_command_360',{p_type:type,p_action:action,p_data:payload,p_actor:context.actor.id,p_expected_version:Number(payload.version)||null,p_reason:text(payload.reason)})
 if(dbError||!data)throw error('appliquer '+action,dbError)
 return data as CreativeRecord
}
