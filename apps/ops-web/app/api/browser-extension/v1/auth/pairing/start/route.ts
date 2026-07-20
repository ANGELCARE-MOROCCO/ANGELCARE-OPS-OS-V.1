import { NextRequest, NextResponse } from 'next/server'
import { currentWebActor, extensionDb } from '@/lib/browser-extension/runtime'
import { hashOpaqueToken, randomOpaqueToken } from '@/lib/browser-extension/security'
import { writeExtensionAudit } from '@/lib/browser-extension/audit'
export async function POST(req:NextRequest){
  const actor=await currentWebActor(); if(!actor?.id) return NextResponse.json({ok:false,error:'Authentication required.'},{status:401})
  const body=await req.json().catch(()=>({})); const installationId=String(body.installationId||'').trim(); if(!installationId) return NextResponse.json({ok:false,error:'Installation ID required.'},{status:400})
  const db=await extensionDb(); const since=new Date(Date.now()-10*60*1000).toISOString(); const {count}=await db.from('browser_extension_pairing_codes').select('id',{count:'exact',head:true}).eq('user_id',actor.id).eq('installation_id',installationId).gte('created_at',since); if(Number(count||0)>=10) return NextResponse.json({ok:false,error:'PAIRING_RATE_LIMITED'},{status:429}); const code=randomOpaqueToken(24); const expiresAt=new Date(Date.now()+Number(process.env.BROWSER_EXTENSION_PAIRING_TTL_SECONDS||90)*1000).toISOString()
  const {error}=await db.from('browser_extension_pairing_codes').insert({code_hash:hashOpaqueToken(code),user_id:actor.id,installation_id:installationId,extension_id:String(body.extensionId||''),device_name:String(body.deviceName||'Chrome device'),platform:String(body.platform||''),browser_version:String(body.browserVersion||''),extension_version:String(body.extensionVersion||''),public_key:body.publicKey||null,expires_at:expiresAt,created_by:actor.id})
  if(error) return NextResponse.json({ok:false,error:'Unable to create pairing authorization.'},{status:500})
  await writeExtensionAudit(db,{actor,eventType:'pairing_started',result:'ok',metadata:{installationId,expiresAt}})
  return NextResponse.json({ok:true,pairingCode:code,expiresAt})
}
