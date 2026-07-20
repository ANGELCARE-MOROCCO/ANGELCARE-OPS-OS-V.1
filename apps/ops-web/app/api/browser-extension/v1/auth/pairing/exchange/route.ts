import { NextRequest, NextResponse } from 'next/server'
import { extensionDb, loadUserAccess } from '@/lib/browser-extension/runtime'
import { hashOpaqueToken, randomOpaqueToken, signAccessToken } from '@/lib/browser-extension/security'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'
export async function POST(req:NextRequest){
  try{
    const body=await req.json(); const pairingCode=String(body.pairingCode||''); const installationId=String(body.installationId||''); if(!pairingCode||!installationId) return NextResponse.json({ok:false,error:'Pairing code and installation ID required.'},{status:400})
    const db=await extensionDb(); const {data:pairing}=await db.from('browser_extension_pairing_codes').select('*').eq('code_hash',hashOpaqueToken(pairingCode)).maybeSingle()
    if(!pairing||pairing.consumed_at||pairing.installation_id!==installationId||(pairing.extension_id&&pairing.extension_id!==String(body.extensionId||''))||new Date(pairing.expires_at).getTime()<=Date.now()) return NextResponse.json({ok:false,error:'PAIRING_CODE_INVALID_OR_EXPIRED'},{status:401})
    const {data:consumed}=await db.from('browser_extension_pairing_codes').update({consumed_at:new Date().toISOString()}).eq('id',pairing.id).is('consumed_at',null).gt('expires_at',new Date().toISOString()).select('*').maybeSingle(); if(!consumed) return NextResponse.json({ok:false,error:'PAIRING_CODE_ALREADY_USED'},{status:401})
    const {data:user}=await db.from('app_users').select('*').eq('id',pairing.user_id).maybeSingle(); if(!user||user.status!=='active') return NextResponse.json({ok:false,error:'USER_DISABLED'},{status:403})
    const access=await loadUserAccess(db,user.id); if(!access.profile?.enabled) return NextResponse.json({ok:false,error:'EXTENSION_ACCESS_NOT_ASSIGNED'},{status:403})
    const devicePayload={installation_id:installationId,user_id:user.id,extension_id:String(body.extensionId||pairing.extension_id||''),device_name:String(body.deviceName||pairing.device_name||'Chrome device'),platform:String(body.platform||pairing.platform||''),browser_version:String(body.browserVersion||pairing.browser_version||''),extension_version:String(body.extensionVersion||pairing.extension_version||''),public_key:body.publicKey||pairing.public_key||null,status:'active',paired_at:new Date().toISOString(),revoked_at:null,revoked_by:null}
    const {data:device,error:deviceError}=await db.from('browser_extension_devices').upsert(devicePayload,{onConflict:'installation_id'}).select('*').single(); if(deviceError||!device) throw deviceError||new Error('DEVICE_CREATE_FAILED')
    await db.from('browser_extension_refresh_tokens').update({revoked_at:new Date().toISOString()}).eq('device_id',device.id).is('revoked_at',null)
    const refreshToken=randomOpaqueToken(48); const refreshDays=Number(process.env.BROWSER_EXTENSION_REFRESH_TOKEN_TTL_DAYS||30); const refreshExpiresAt=new Date(Date.now()+refreshDays*86400000).toISOString()
    await db.from('browser_extension_refresh_tokens').insert({device_id:device.id,user_id:user.id,token_hash:hashOpaqueToken(refreshToken),expires_at:refreshExpiresAt})
    const signed=signAccessToken({sub:user.id,deviceId:device.id,accessVersion:Number(access.profile.access_version||1)})
    await writeExtensionAudit(db,{actor:user,deviceId:device.id,eventType:'device_paired',result:'ok',metadata:{installationId,extensionVersion:device.extension_version}})
    return NextResponse.json({ok:true,deviceId:device.id,accessToken:signed.token,refreshToken,expiresAt:signed.expiresAt,refreshExpiresAt})
  }catch(error){ console.error('[BROWSER_EXTENSION_PAIRING_EXCHANGE]',error); return NextResponse.json({ok:false,error:'PAIRING_EXCHANGE_FAILED'},{status:500}) }
}
