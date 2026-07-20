import { NextRequest, NextResponse } from 'next/server'
import { extensionDb, loadUserAccess } from '@/lib/browser-extension/runtime'
import { hashOpaqueToken, randomOpaqueToken, signAccessToken } from '@/lib/browser-extension/security'
export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({})); const refreshToken=String(body.refreshToken||''); const deviceId=String(body.deviceId||''); if(!refreshToken||!deviceId) return NextResponse.json({ok:false,error:'Refresh token and device ID required.'},{status:400})
  const db=await extensionDb(); const {data:row}=await db.from('browser_extension_refresh_tokens').select('*').eq('token_hash',hashOpaqueToken(refreshToken)).eq('device_id',deviceId).is('revoked_at',null).gt('expires_at',new Date().toISOString()).maybeSingle(); if(!row) return NextResponse.json({ok:false,error:'REFRESH_TOKEN_INVALID'},{status:401})
  const {data:device}=await db.from('browser_extension_devices').select('*').eq('id',deviceId).eq('status','active').maybeSingle(); if(!device || device.user_id!==row.user_id) return NextResponse.json({ok:false,error:'DEVICE_REVOKED'},{status:401})
  const access=await loadUserAccess(db,row.user_id); if(!access.profile?.enabled) return NextResponse.json({ok:false,error:'ACCESS_DISABLED'},{status:403})
  const next=randomOpaqueToken(48); const expiresAt=new Date(Date.now()+Number(process.env.BROWSER_EXTENSION_REFRESH_TOKEN_TTL_DAYS||30)*86400000).toISOString(); const {data:created}=await db.from('browser_extension_refresh_tokens').insert({device_id:deviceId,user_id:row.user_id,token_hash:hashOpaqueToken(next),expires_at:expiresAt,rotated_from:row.id}).select('id').single(); await db.from('browser_extension_refresh_tokens').update({revoked_at:new Date().toISOString(),last_used_at:new Date().toISOString()}).eq('id',row.id)
  const signed=signAccessToken({sub:row.user_id,deviceId,accessVersion:Number(access.profile.access_version||1)})
  return NextResponse.json({ok:true,accessToken:signed.token,refreshToken:next,expiresAt:signed.expiresAt,refreshExpiresAt:expiresAt,rotationId:created?.id})
}
