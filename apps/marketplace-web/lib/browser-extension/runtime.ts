import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { bearerToken, verifyAccessToken } from './security'
import { isExtensionAdmin } from './access'
import type { BrowserExtensionActor, ExtensionAuthContext } from './types'
export async function extensionDb(){ return createClient() }
export async function currentWebActor(){ return (await getCurrentUser().catch(()=>null)) as BrowserExtensionActor | null }
export async function requireExtensionAdminApi(){ const user=await currentWebActor(); if(!user) return {ok:false as const,response:NextResponse.json({ok:false,error:'Authentication required.'},{status:401})}; if(!isExtensionAdmin(user)) return {ok:false as const,response:NextResponse.json({ok:false,error:'Browser extension administrator access required.'},{status:403})}; return {ok:true as const,user,db:await extensionDb()} }
export async function authenticateExtensionRequest(request:Request):Promise<{ok:true;context:ExtensionAuthContext;db:Awaited<ReturnType<typeof extensionDb>>}|{ok:false;response:NextResponse}> {
  try {
    const token=bearerToken(request); if(!token) return {ok:false,response:NextResponse.json({ok:false,error:'Extension access token required.'},{status:401})}
    const claims=verifyAccessToken(token); const db=await extensionDb()
    const [{data:device},{data:user},{data:profile}] = await Promise.all([
      db.from('browser_extension_devices').select('*').eq('id',claims.deviceId).maybeSingle(),
      db.from('app_users').select('*').eq('id',claims.sub).maybeSingle(),
      db.from('browser_extension_access_profiles').select('access_version,enabled,valid_until').eq('user_id',claims.sub).maybeSingle(),
    ])
    if(!device || device.status!=='active' || device.user_id!==claims.sub) throw new Error('DEVICE_REVOKED')
    const origin=request.headers.get('origin'); if(origin&&device.extension_id&&origin!==`chrome-extension://${device.extension_id}`) throw new Error('EXTENSION_ORIGIN_MISMATCH')
    if(!user || user.status!=='active') throw new Error('USER_DISABLED')
    if(!profile?.enabled || Number(profile.access_version)!==Number(claims.accessVersion)) throw new Error('ACCESS_CHANGED')
    if(profile.valid_until && new Date(profile.valid_until).getTime()<=Date.now()) throw new Error('ACCESS_EXPIRED')
    const [{data:killSwitches},{data:knownBad}] = await Promise.all([
      db.from('browser_extension_production_kill_switches').select('switch_key,scope_type,scope_reference,reason,expires_at').eq('active',true),
      db.from('browser_extension_release_versions').select('known_bad,known_bad_reason').eq('version',device.extension_version||'').maybeSingle(),
    ])
    const activeSwitch=(killSwitches||[]).find((row:any)=>!row.expires_at||new Date(row.expires_at).getTime()>Date.now())
    const blockingSwitch=(killSwitches||[]).find((row:any)=>['global','extension','device'].includes(row.scope_type)&&(row.scope_reference==='*'||row.scope_reference===device.id||row.scope_reference===device.release_channel))
    if(blockingSwitch) throw new Error(`PRODUCTION_KILL_SWITCH:${blockingSwitch.switch_key}`)
    if(knownBad?.known_bad) throw new Error(`KNOWN_BAD_EXTENSION_VERSION:${knownBad.known_bad_reason||device.extension_version}`)
    await db.from('browser_extension_devices').update({last_seen_at:new Date().toISOString(),last_ip:request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||null,health_status:activeSwitch?'degraded':device.health_status||'unknown'}).eq('id',device.id)
    return {ok:true,context:{claims,device,user},db}
  } catch(error){ return {ok:false,response:NextResponse.json({ok:false,error:error instanceof Error?error.message:'EXTENSION_AUTH_FAILED'},{status:401})} }
}
export async function loadUserAccess(db:Awaited<ReturnType<typeof extensionDb>>, userId:string){
  const [profileR,modulesR,submodulesR,capabilitiesR,adaptersR,scopesR,autonomyR,approvalsR] = await Promise.all([
    db.from('browser_extension_access_profiles').select('*').eq('user_id',userId).maybeSingle(),
    db.from('browser_extension_module_grants').select('*').eq('user_id',userId).eq('enabled',true),
    db.from('browser_extension_submodule_grants').select('*').eq('user_id',userId).eq('enabled',true),
    db.from('browser_extension_capability_grants').select('*').eq('user_id',userId).eq('enabled',true),
    db.from('browser_extension_adapter_grants').select('*').eq('user_id',userId).eq('enabled',true),
    db.from('browser_extension_data_scopes').select('*').eq('user_id',userId),
    db.from('browser_extension_autonomy_rules').select('*').eq('user_id',userId).eq('enabled',true).order('priority',{ascending:false}),
    db.from('browser_extension_approval_rules').select('*').eq('user_id',userId).eq('enabled',true),
  ])
  return {profile:profileR.data,modules:modulesR.data||[],submodules:submodulesR.data||[],capabilities:capabilitiesR.data||[],adapters:adaptersR.data||[],scopes:scopesR.data||[],autonomy:autonomyR.data||[],approvals:approvalsR.data||[]}
}
