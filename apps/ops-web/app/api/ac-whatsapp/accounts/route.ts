import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok, scopeAccounts } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'

function sessionName(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||`angelcare-${crypto.randomUUID().slice(0,8)}`}
export async function GET(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.view');if('error'in context)return context.error
 const result=await scopeAccounts(context.supabase.from('ac_whatsapp_accounts').select('*,queue:ac_whatsapp_queues(*)'),context).order('created_at',{ascending:false})
 if(result.error)return fail(result.error.message,500);return ok(result.data||[])
}
export async function POST(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.account.manage');if('error'in context)return context.error
 const body=await request.json().catch(()=>({}));if(!body.name)return fail('ACCOUNT_NAME_REQUIRED',422);if(!openwa.configured())return fail('OPENWA_NOT_CONFIGURED',503)
 const name=sessionName(body.openwa_session_name||body.name);let session:any
 try{session=await openwa.createSession({name,config:{autoReconnect:true,autoRejectCalls:Boolean(body.auto_reject_calls)}})}catch(cause){return fail(cause instanceof Error?cause.message:'OPENWA_SESSION_CREATE_FAILED',502)}
 const account=await context.supabase.from('ac_whatsapp_accounts').insert({code:body.code||name.toUpperCase().replaceAll('-','_'),name:String(body.name),phone_number_e164:body.phone_number_e164||null,department:body.department||'Commercial',purpose:body.purpose||'Communications ANGELCARE',openwa_session_id:session.id,openwa_session_name:session.name||name,engine_type:body.engine_type||'whatsapp-web.js',status:session.status||'draft',default_queue_id:body.default_queue_id||null,outbound_enabled:body.outbound_enabled!==false,campaigns_enabled:body.campaigns_enabled!==false,cold_prospecting_enabled:body.cold_prospecting_enabled!==false,bulk_messaging_enabled:body.bulk_messaging_enabled!==false,settings:body.settings||{},runtime_metadata:session,created_by:context.user.id,updated_by:context.user.id}).select('*').single()
 if(account.error){try{await openwa.stopSession(session.id)}catch{};return fail(account.error.message,500)}
 const webhookUrl=process.env.AC_WHATSAPP_WEBHOOK_PUBLIC_URL;const secret=process.env.AC_WHATSAPP_WEBHOOK_SECRET
 if(webhookUrl&&secret){try{await openwa.createWebhook(session.id,{url:webhookUrl,events:['message.received','message.sent','message.ack','message.failed','message.revoked','message.reaction','message.edited','session.status','session.qr','session.authenticated','session.disconnected','session.reconnect_loop','call.received'],secret,active:true,retryCount:5})}catch(cause){await context.supabase.from('ac_whatsapp_security_events').insert({severity:'high',event_type:'webhook.registration_failed',title:'Webhook OpenWA non enregistré',description:cause instanceof Error?cause.message:'Erreur inconnue',account_id:account.data.id,metadata:{sessionId:session.id}})}}
 if(body.auto_start!==false){try{const started:any=await openwa.startSession(session.id);await context.supabase.from('ac_whatsapp_accounts').update({status:started.status||'starting',runtime_metadata:started}).eq('id',account.data.id)}catch(cause){await context.supabase.from('ac_whatsapp_accounts').update({status:'error',last_error:cause instanceof Error?cause.message:'OPENWA_START_FAILED'}).eq('id',account.data.id)}}
 await audit(context,{action:'account.create',entityType:'account',entityId:account.data.id,newState:account.data});return ok(account.data,{status:201})
}
