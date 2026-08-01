import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/ac-whatsapp/server'
import { mapAckStatus, normalizeOpenWAEvent, verifyOpenWASignature } from '@/lib/ac-whatsapp/webhook'

export const runtime = 'nodejs'
const MEDIA_BUCKET = 'ac-whatsapp-media'

function sessionIdFrom(payload:any, normalized:any, request:NextRequest){return String(payload?.sessionId||payload?.session?.id||payload?.data?.sessionId||normalized?.root?.sessionId||request.headers.get('x-openwa-session-id')||'')}
function safeRawPayload(payload:any){try{return JSON.parse(JSON.stringify(payload,(key,value)=>key==='data'&&typeof value==='string'&&value.length>10000?`[base64 omitted:${value.length} chars]`:value))}catch{return{unserializable:true}}}
function mediaEnvelope(normalized:any){return normalized?.message?.media||normalized?.root?.media||normalized?.root?.message?.media||null}
function extension(filename:string|undefined,mime:string|undefined){if(filename?.includes('.'))return filename.split('.').pop()!.replace(/[^a-z0-9]/gi,'').slice(0,10)||'bin';const map:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','audio/ogg':'ogg','audio/mpeg':'mp3','application/pdf':'pdf'};return map[String(mime||'').toLowerCase()]||'bin'}
async function persistMedia(supabase:any,input:{accountId:string;conversationId:string;messageId:string;externalId:string|null;media:any}){
 const media=input.media;if(!media)return
 const filename=String(media.filename||`${input.externalId||input.messageId}.${extension(undefined,media.mimetype)}`)
 let storagePath:string|null=null;let size=Number(media.sizeBytes||0)||null;let metadata:any={omitted:Boolean(media.omitted)}
 if(typeof media.data==='string'&&media.data){
  try{
   const buffer=Buffer.from(media.data,'base64');size=buffer.length
   if(buffer.length<=52_428_800){
    storagePath=`${input.accountId}/${input.conversationId}/${input.messageId}-${filename.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const upload=await supabase.storage.from(MEDIA_BUCKET).upload(storagePath,buffer,{contentType:media.mimetype||'application/octet-stream',upsert:true})
    if(upload.error){metadata={...metadata,storage_error:upload.error.message};storagePath=null}
   }else metadata={...metadata,storage_error:'MEDIA_OVER_50MB'}
  }catch(cause){metadata={...metadata,storage_error:cause instanceof Error?cause.message:String(cause)}}
 }
 await supabase.from('ac_whatsapp_attachments').insert({message_id:input.messageId,storage_provider:storagePath?'supabase':'openwa',storage_path:storagePath,file_name:filename,mime_type:media.mimetype||null,size_bytes:size,metadata})
}

export async function POST(request:NextRequest){
 const raw=await request.text();const signature=request.headers.get('x-openwa-signature');const secret=String(process.env.AC_WHATSAPP_WEBHOOK_SECRET||'')
 if(!verifyOpenWASignature(raw,signature,secret))return fail('INVALID_WEBHOOK_SIGNATURE',401)
 let payload:any;try{payload=JSON.parse(raw)}catch{return fail('INVALID_JSON',400)}
 const eventType=String(request.headers.get('x-openwa-event')||payload.event||payload.type||'unknown')
 const deliveryId=String(request.headers.get('x-openwa-delivery-id')||crypto.randomUUID());const idempotencyKey=request.headers.get('x-openwa-idempotency-key');const retryCount=Number(request.headers.get('x-openwa-retry-count')||0)
 const supabase=await createServiceClient();const normalized=normalizeOpenWAEvent(eventType,payload);const sid=sessionIdFrom(payload,normalized,request)
 const recorded=await supabase.from('ac_whatsapp_webhook_events').insert({delivery_id:deliveryId,idempotency_key:idempotencyKey,event_type:eventType,openwa_session_id:sid||null,signature_valid:true,retry_count:retryCount,raw_payload:safeRawPayload(payload)}).select('id').maybeSingle()
 if(recorded.error?.code==='23505')return ok({duplicate:true});if(recorded.error)return fail(recorded.error.message,500)
 try{
  const accountResult=sid?await supabase.from('ac_whatsapp_accounts').select('*').eq('openwa_session_id',sid).maybeSingle():{data:null,error:null};if(accountResult.error)throw accountResult.error
  const account:any=accountResult.data
  if(eventType.startsWith('session.')){
   if(account){const statusMap:Record<string,string>={'session.authenticated':'connected','session.disconnected':'disconnected','session.reconnect_loop':'reconnecting','session.qr':'qr_required'};const status=statusMap[eventType]||String(normalized.root?.status||payload?.status||account.status);await supabase.from('ac_whatsapp_accounts').update({status,runtime_metadata:safeRawPayload(payload),last_activity_at:new Date().toISOString(),last_error:eventType==='session.disconnected'?String(payload?.error||payload?.reason||'Disconnected'):null,connected_at:eventType==='session.authenticated'?new Date().toISOString():account.connected_at}).eq('id',account.id)}
  }else if(eventType==='message.ack'||eventType==='message.failed'||eventType==='message.revoked'){
   const external=normalized.externalMessageId;if(account&&external){const status=eventType==='message.failed'?'failed':eventType==='message.revoked'?'revoked':mapAckStatus(normalized.ack);const patch:any={status,updated_at:new Date().toISOString()};if(status==='delivered')patch.delivered_at=new Date().toISOString();if(status==='read')patch.read_at=new Date().toISOString();if(status==='failed')patch.error_message=String(payload?.error||payload?.reason||'Delivery failed');await supabase.from('ac_whatsapp_messages').update(patch).eq('account_id',account.id).eq('external_message_id',external);await supabase.from('ac_whatsapp_campaign_recipients').update(status==='read'?{status:'read',read_at:new Date().toISOString()}:status==='delivered'?{status:'delivered',delivered_at:new Date().toISOString()}:status==='failed'?{status:'failed',failure_reason:patch.error_message}:{status:'sent'}).eq('external_message_id',external)}
  }else if(['message.received','message.sent','message.edited','message.reaction'].includes(eventType)){
   if(!account)throw new Error(`UNKNOWN_OPENWA_SESSION:${sid}`)
   const remote=normalized.chatId||normalized.from||normalized.to;if(!remote)throw new Error('MISSING_REMOTE_CHAT_ID')
   if(normalized.externalMessageId){const existing=await supabase.from('ac_whatsapp_messages').select('id,conversation_id,status').eq('account_id',account.id).eq('external_message_id',normalized.externalMessageId).maybeSingle();if(existing.error)throw existing.error;if(existing.data){await supabase.from('ac_whatsapp_messages').update({status:normalized.fromMe?'sent':existing.data.status,body:normalized.body||undefined,raw_payload:safeRawPayload(payload),updated_at:new Date().toISOString()}).eq('id',existing.data.id);await supabase.from('ac_whatsapp_webhook_events').update({processing_status:'processed',processed_at:new Date().toISOString()}).eq('delivery_id',deliveryId);return ok({processed:true,eventType,deduplicated:true})}}
   const contactWa=normalized.fromMe?normalized.to||remote:normalized.from||remote;const phone=String(contactWa).replace(/@.*/,'').replace(/\D/g,'')
   const contactUpsert=await supabase.from('ac_whatsapp_contacts').upsert({whatsapp_id:contactWa,phone_number_e164:phone?`+${phone}`:null,display_name:normalized.senderName||normalized.message?.contact?.pushName||normalized.message?.contact?.name||phone||contactWa,contact_type:'unknown',last_contact_at:normalized.timestamp,last_response_at:normalized.fromMe?null:normalized.timestamp},{onConflict:'whatsapp_id'}).select('*').single();if(contactUpsert.error)throw contactUpsert.error
   const queueId=account.default_queue_id||null;let conv=await supabase.from('ac_whatsapp_conversations').select('*').eq('account_id',account.id).eq('remote_chat_id',remote).maybeSingle();if(conv.error)throw conv.error
   if(!conv.data){const created=await supabase.from('ac_whatsapp_conversations').insert({account_id:account.id,contact_id:contactUpsert.data.id,remote_chat_id:remote,queue_id:queueId,status:normalized.fromMe?'waiting_customer':'new',priority:'normal',unread_count:normalized.fromMe?0:1,message_count:1,last_message_preview:(normalized.body||`[${normalized.type}]`).slice(0,240),last_message_direction:normalized.fromMe?'outbound':'inbound',last_message_at:normalized.timestamp,sla_first_response_due_at:new Date(Date.now()+15*60000).toISOString(),sla_resolution_due_at:new Date(Date.now()+240*60000).toISOString()}).select('*').single();if(created.error)throw created.error;conv=created}else{const updates:any={last_message_preview:(normalized.body||`[${normalized.type}]`).slice(0,240),last_message_direction:normalized.fromMe?'outbound':'inbound',last_message_at:normalized.timestamp,message_count:(conv.data.message_count||0)+1,status:normalized.fromMe?'waiting_customer':conv.data.status==='closed'?'reopened':conv.data.status,unread_count:normalized.fromMe?conv.data.unread_count||0:(conv.data.unread_count||0)+1};await supabase.from('ac_whatsapp_conversations').update(updates).eq('id',conv.data.id)}
   const insert=await supabase.from('ac_whatsapp_messages').insert({account_id:account.id,conversation_id:conv.data.id,contact_id:contactUpsert.data.id,external_message_id:normalized.externalMessageId,direction:normalized.fromMe?'outbound':'inbound',message_type:normalized.type,body:normalized.body,caption:normalized.message?.caption||null,quoted_external_message_id:normalized.message?.quotedMessage?.id||null,status:normalized.fromMe?'sent':'received',sender_whatsapp_id:normalized.from,recipient_whatsapp_id:normalized.to,raw_payload:safeRawPayload(payload),sent_at:normalized.fromMe?normalized.timestamp:null,received_at:normalized.fromMe?null:normalized.timestamp,created_at:normalized.timestamp}).select('id').single();if(insert.error)throw insert.error
   await persistMedia(supabase,{accountId:account.id,conversationId:conv.data.id,messageId:insert.data.id,externalId:normalized.externalMessageId,media:mediaEnvelope(normalized)})
   if(!normalized.fromMe){const recent=await supabase.from('ac_whatsapp_campaign_recipients').select('id,campaign_id,external_message_id').eq('contact_id',contactUpsert.data.id).in('status',['sent','delivered','read']).order('sent_at',{ascending:false}).limit(1).maybeSingle();if(recent.error)throw recent.error;if(recent.data)await supabase.from('ac_whatsapp_campaign_recipients').update({status:'replied',replied_at:normalized.timestamp}).eq('id',recent.data.id)}
  }
  await supabase.from('ac_whatsapp_webhook_events').update({processing_status:'processed',processed_at:new Date().toISOString()}).eq('delivery_id',deliveryId)
  return ok({processed:true,eventType})
 }catch(cause){const message=cause instanceof Error?cause.message:String(cause);await supabase.from('ac_whatsapp_webhook_events').update({processing_status:'failed',error_message:message,processed_at:new Date().toISOString()}).eq('delivery_id',deliveryId);await supabase.from('ac_whatsapp_security_events').insert({severity:'high',event_type:'webhook.processing_failed',title:'Échec de traitement webhook OpenWA',description:message,account_id:null,metadata:{eventType,deliveryId,sessionId:sid}});return fail('WEBHOOK_PROCESSING_FAILED',500,message)}
}
