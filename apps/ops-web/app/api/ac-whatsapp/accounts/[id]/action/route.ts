import { NextRequest } from 'next/server'
import { acContext, audit, fail, hasAccountCapability, ok } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const context=await acContext(request,'ac-whatsapp.account.manage');if('error'in context)return context.error;const {id}=await params
 if(!hasAccountCapability(context,id,'admin'))return fail('ACCOUNT_ADMIN_ACCESS_DENIED',403)
 const body=await request.json().catch(()=>({}));const action=String(body.action||'');const row=await context.supabase.from('ac_whatsapp_accounts').select('*').eq('id',id).maybeSingle();if(row.error)return fail(row.error.message,500);if(!row.data)return fail('ACCOUNT_NOT_FOUND',404);const sid=row.data.openwa_session_id;if(!sid)return fail('ACCOUNT_SESSION_NOT_CONFIGURED',409)
 try{let data:any;if(action==='start')data=await openwa.startSession(sid);else if(action==='stop')data=await openwa.stopSession(sid);else if(action==='logout')data=await openwa.logoutSession(sid);else if(action==='qr')data=await openwa.getQr(sid);else if(action==='pairing'){const phone=String(body.phoneNumber||row.data.phone_number_e164||'').replace(/\D/g,'');if(!phone)return fail('PAIRING_PHONE_REQUIRED',422);data=await openwa.pairingCode(sid,phone)}else if(action==='sync')data=await openwa.getSession(sid);else if(action==='pause'){data={status:'paused'};await context.supabase.from('ac_whatsapp_accounts').update({status:'paused',outbound_enabled:false}).eq('id',id)}else if(action==='resume'){data=await openwa.startSession(sid);await context.supabase.from('ac_whatsapp_accounts').update({outbound_enabled:true}).eq('id',id)}else return fail('INVALID_ACTION',422)
  if(action!=='qr'&&action!=='pairing')await context.supabase.from('ac_whatsapp_accounts').update({status:data?.status||row.data.status,runtime_metadata:data||{},last_error:null,last_activity_at:new Date().toISOString()}).eq('id',id)
  await audit(context,{action:`account.${action}`,entityType:'account',entityId:id,newState:data});return ok(data)
 }catch(cause){const message=cause instanceof Error?cause.message:'OPENWA_ACTION_FAILED';await context.supabase.from('ac_whatsapp_accounts').update({status:'error',last_error:message}).eq('id',id);return fail(message,502)}
}
