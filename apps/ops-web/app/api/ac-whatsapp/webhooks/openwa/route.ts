import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail, normalizeOpenWAAccountStatus, ok } from '@/lib/ac-whatsapp/server'
import { mapAckStatus, normalizeOpenWAEvent, verifyOpenWASignature } from '@/lib/ac-whatsapp/webhook'
import { ingestOpenWAMedia, mediaVaultStorageKey } from '@/lib/ac-whatsapp/media-vault'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'

export const runtime = 'nodejs'

function sessionIdFrom(payload:any, normalized:any, request:NextRequest){return String(payload?.sessionId||payload?.session?.id||payload?.data?.sessionId||normalized?.root?.sessionId||request.headers.get('x-openwa-session-id')||'')}
function safeRawPayload(payload:any){try{return JSON.parse(JSON.stringify(payload,(key,value)=>key==='data'&&typeof value==='string'&&value.length>10000?`[base64 omitted:${value.length} chars]`:value))}catch{return{unserializable:true}}}
function mediaEnvelope(normalized:any){return normalized?.message?.media||normalized?.root?.media||normalized?.root?.message?.media||null}
function extension(filename:string|undefined,mime:string|undefined){if(filename?.includes('.'))return filename.split('.').pop()!.replace(/[^a-z0-9]/gi,'').slice(0,10)||'bin';const map:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','audio/ogg':'ogg','audio/mpeg':'mp3','application/pdf':'pdf'};return map[String(mime||'').toLowerCase()]||'bin'}
function digits(value:unknown){const result=String(value||'').replace(/\D/g,'');return /^\d{8,15}$/.test(result)?result:''}
function e164(value:unknown){const valueDigits=digits(value);return valueDigits?`+${valueDigits}`:null}
function isLid(value:unknown){return /@lid$/i.test(String(value||'').trim())}
function identityType(value:string){if(/@lid$/i.test(value))return'lid';if(/@c\.us$/i.test(value))return'c_us';return'remote_chat'}
function meaningfulName(value:unknown){const text=String(value||'').trim();if(!text)return false;if(['unknown','[unknown]','inconnu','[inconnu]','contact','whatsapp','undefined','null'].includes(text.toLowerCase()))return false;if(/^\+?\d{7,}$/.test(text.replace(/[\s().-]/g,'')))return false;if(/@(?:lid|c\.us|g\.us)$/i.test(text))return false;return true}

async function persistMedia(supabase:any,input:{accountId:string;conversationId:string;messageId:string;externalId:string|null;media:any;hasMedia:boolean;sessionId:string;chatId:string}){
 const media=input.media
 if(!media&&!input.hasMedia)return
 const mimeType=String(media?.mimetype||media?.mimeType||'application/octet-stream')
 const fileName=String(media?.filename||media?.fileName||`${input.externalId||input.messageId}.${extension(undefined,mimeType)}`).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,180)
 const storageKey=mediaVaultStorageKey({accountId:input.accountId,conversationId:input.conversationId,category:'inbound',objectId:input.messageId,fileName})
 const inserted=await supabase.from('ac_whatsapp_attachments').insert({
  message_id:input.messageId,storage_provider:'windows_pending',storage_path:storageKey,storage_host:process.env.AC_WHATSAPP_MEDIA_VAULT_BASE_URL||null,file_name:fileName,mime_type:mimeType,size_bytes:Number(media?.sizeBytes||media?.size||0)||null,migration_status:'pending_ingest',metadata:{omitted:Boolean(media?.omitted),primary_storage:'windows'},
 }).select('id').single()
 if(inserted.error)throw inserted.error
 if(!input.sessionId||!input.chatId||!input.externalId)return
 try{
  const receipt=await ingestOpenWAMedia({storageKey,sessionId:input.sessionId,chatId:input.chatId,externalMessageId:input.externalId,fileName,mimeType,maxBytes:52_428_800})
  await supabase.from('ac_whatsapp_attachments').update({storage_provider:'windows',storage_path:receipt.storageKey,file_name:receipt.fileName,mime_type:receipt.mimeType,size_bytes:receipt.sizeBytes,checksum:receipt.sha256,verified_at:new Date().toISOString(),migration_status:'ready',metadata:{omitted:false,primary_storage:'windows',ingested_from_openwa_at:new Date().toISOString()}}).eq('id',inserted.data.id)
 }catch(cause){
  await supabase.from('ac_whatsapp_attachments').update({migration_status:'pending_ingest',metadata:{omitted:Boolean(media?.omitted),primary_storage:'windows',ingest_error:cause instanceof Error?cause.message:String(cause),ingest_last_attempt_at:new Date().toISOString()}}).eq('id',inserted.data.id)
 }
}

async function markWebhook(supabase:any,deliveryId:string,status:'processed'|'ignored'|'failed',error?:string){
 const patch:any={processing_status:status,processed_at:new Date().toISOString()};if(error)patch.error_message=error
 await supabase.from('ac_whatsapp_webhook_events').update(patch).eq('delivery_id',deliveryId)
}

async function identityContactId(supabase:any,accountId:string,values:string[]){
 for(const value of values.filter(Boolean)){
  const found=await supabase.from('ac_whatsapp_contact_identities').select('contact_id').eq('account_id',accountId).eq('identity_value',value).order('confidence',{ascending:false}).limit(1).maybeSingle()
  if(found.error){if(found.error.code==='42P01')return null;throw found.error}
  if(found.data?.contact_id)return String(found.data.contact_id)
 }
 return null
}

async function ensureIdentity(supabase:any,input:{contactId:string;accountId:string;type:string;value:string;canonicalE164?:string|null;confidence?:number;source?:string}){
 if(!input.value)return
 const existing=await supabase.from('ac_whatsapp_contact_identities').select('id').eq('account_id',input.accountId).eq('identity_type',input.type).eq('identity_value',input.value).limit(1).maybeSingle()
 if(existing.error){if(existing.error.code==='42P01')return;throw existing.error}
 const patch={contact_id:input.contactId,canonical_e164:input.canonicalE164||null,confidence:input.confidence??85,source:input.source||'openwa_webhook',last_seen_at:new Date().toISOString(),verified_at:input.canonicalE164?new Date().toISOString():null}
 if(existing.data?.id){const updated=await supabase.from('ac_whatsapp_contact_identities').update(patch).eq('id',existing.data.id);if(updated.error)throw updated.error;return}
 const inserted=await supabase.from('ac_whatsapp_contact_identities').insert({...patch,account_id:input.accountId,identity_type:input.type,identity_value:input.value,is_primary:input.type==='e164'});if(inserted.error&&inserted.error.code!=='23505')throw inserted.error
}

async function resolvePhoneForRemote(sessionId:string,remote:string,senderPhone:unknown){
 const direct=e164(senderPhone)
 if(direct)return direct
 if(/@c\.us$/i.test(remote))return e164(remote.replace(/@c\.us$/i,''))
 if(!isLid(remote)||!sessionId)return null
 try{const resolved=await openwa.resolveContactPhone(sessionId,remote);return e164(resolved)}catch{return null}
}

async function resolveContact(supabase:any,input:{account:any;sessionId:string;remote:string;normalized:any}){
 const phone=await resolvePhoneForRemote(input.sessionId,input.remote,input.normalized.senderPhone)
 const aliases=[input.remote,phone||''].filter(Boolean)
 let contact:any=null
 const aliasContactId=await identityContactId(supabase,input.account.id,aliases)
 if(aliasContactId){const found=await supabase.from('ac_whatsapp_contacts').select('*').eq('id',aliasContactId).maybeSingle();if(found.error)throw found.error;contact=found.data}
 if(!contact){const exact=await supabase.from('ac_whatsapp_contacts').select('*').eq('whatsapp_id',input.remote).maybeSingle();if(exact.error)throw exact.error;contact=exact.data}
 if(!contact&&phone){const byPhone=await supabase.from('ac_whatsapp_contacts').select('*').eq('phone_number_e164',phone).order('updated_at',{ascending:false}).limit(1).maybeSingle();if(byPhone.error)throw byPhone.error;contact=byPhone.data}
 const incomingName=!input.normalized.fromMe&&meaningfulName(input.normalized.senderName)?String(input.normalized.senderName).trim():null
 if(!contact){
  const created=await supabase.from('ac_whatsapp_contacts').insert({whatsapp_id:input.remote,phone_number_e164:phone,display_name:incomingName,contact_type:'unqualified',preferred_language:'fr',lead_stage:'new',priority:'normal',tags:[],last_contact_at:input.normalized.timestamp,last_response_at:input.normalized.fromMe?null:input.normalized.timestamp}).select('*').single();if(created.error)throw created.error;contact=created.data
 }else{
  const patch:any={last_contact_at:input.normalized.timestamp,updated_at:new Date().toISOString()}
  if(!input.normalized.fromMe)patch.last_response_at=input.normalized.timestamp
  if(phone&&contact.phone_number_e164!==phone)patch.phone_number_e164=phone
  if(incomingName&&!meaningfulName(contact.display_name))patch.display_name=incomingName
  const updated=await supabase.from('ac_whatsapp_contacts').update(patch).eq('id',contact.id).select('*').single();if(updated.error)throw updated.error;contact=updated.data
 }
 await ensureIdentity(supabase,{contactId:contact.id,accountId:input.account.id,type:identityType(input.remote),value:input.remote,canonicalE164:phone,confidence:phone?95:80})
 if(phone)await ensureIdentity(supabase,{contactId:contact.id,accountId:input.account.id,type:'e164',value:phone,canonicalE164:phone,confidence:100,source:isLid(input.remote)?'openwa_lid_phone_resolution':'openwa_webhook'})
 if(phone)await ensureIdentity(supabase,{contactId:contact.id,accountId:input.account.id,type:'c_us',value:`${digits(phone)}@c.us`,canonicalE164:phone,confidence:100,source:'openwa_phone_canonical'})
 return contact
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
   if(account){const statusMap:Record<string,string>={'session.authenticated':'connected','session.disconnected':'disconnected','session.reconnect_loop':'reconnecting','session.qr':'qr_required'};const status=normalizeOpenWAAccountStatus(statusMap[eventType]||normalized.root?.status||payload?.status,account.status);await supabase.from('ac_whatsapp_accounts').update({status,runtime_metadata:safeRawPayload(payload),last_activity_at:new Date().toISOString(),last_error:eventType==='session.disconnected'?String(payload?.error||payload?.reason||'Disconnected'):null,connected_at:eventType==='session.authenticated'?new Date().toISOString():account.connected_at}).eq('id',account.id)}
  }else if(eventType==='message.ack'||eventType==='message.failed'||eventType==='message.revoked'){
   const external=normalized.externalMessageId;if(account&&external){const status=eventType==='message.failed'?'failed':eventType==='message.revoked'?'revoked':mapAckStatus(normalized.ack);const patch:any={status,updated_at:new Date().toISOString()};if(status==='delivered')patch.delivered_at=new Date().toISOString();if(status==='read')patch.read_at=new Date().toISOString();if(status==='failed')patch.error_message=String(payload?.error||payload?.reason||'Delivery failed');await supabase.from('ac_whatsapp_messages').update(patch).eq('account_id',account.id).eq('external_message_id',external);await supabase.from('ac_whatsapp_campaign_recipients').update(status==='read'?{status:'read',read_at:new Date().toISOString()}:status==='delivered'?{status:'delivered',delivered_at:new Date().toISOString()}:status==='failed'?{status:'failed',failure_reason:patch.error_message}:{status:'sent'}).eq('external_message_id',external)}
  }else if(['message.received','message.sent','message.edited','message.reaction'].includes(eventType)){
   if(!account)throw new Error(`UNKNOWN_OPENWA_SESSION:${sid}`)
   if(!normalized.renderable){await markWebhook(supabase,deliveryId,'ignored');return ok({processed:true,eventType,ignored:true,reason:'NON_RENDERABLE_MESSAGE_EVENT'})}
   const remote=String(normalized.chatId||normalized.from||normalized.to||'').trim();if(!remote)throw new Error('MISSING_REMOTE_CHAT_ID')
   if(normalized.externalMessageId){
    const existing=await supabase.from('ac_whatsapp_messages').select('id,conversation_id,status').eq('account_id',account.id).eq('external_message_id',normalized.externalMessageId).maybeSingle();if(existing.error)throw existing.error
    if(existing.data){const patch:any={raw_payload:safeRawPayload(payload),updated_at:new Date().toISOString()};if(normalized.fromMe)patch.status='sent';if(normalized.body)patch.body=normalized.body;if(normalized.caption)patch.caption=normalized.caption;if(normalized.type&&normalized.type!=='unknown')patch.message_type=normalized.type;await supabase.from('ac_whatsapp_messages').update(patch).eq('id',existing.data.id);await markWebhook(supabase,deliveryId,'processed');return ok({processed:true,eventType,deduplicated:true})}
   }
   const contactWa=String(normalized.fromMe?(normalized.to||remote):(normalized.from||remote)).trim()||remote
   const contact=await resolveContact(supabase,{account,sessionId:sid,remote:contactWa,normalized})
   const queueId=account.default_queue_id||null
   let conv=await supabase.from('ac_whatsapp_conversations').select('*').eq('account_id',account.id).eq('remote_chat_id',remote).maybeSingle();if(conv.error)throw conv.error
   if(!conv.data){const byContact=await supabase.from('ac_whatsapp_conversations').select('*').eq('account_id',account.id).eq('contact_id',contact.id).order('last_message_at',{ascending:false}).limit(1).maybeSingle();if(byContact.error)throw byContact.error;if(byContact.data){const rebound=await supabase.from('ac_whatsapp_conversations').update({remote_chat_id:remote,updated_at:new Date().toISOString()}).eq('id',byContact.data.id).select('*').single();if(rebound.error)throw rebound.error;conv=rebound}}
   const senderDisplayName=normalized.fromMe?(account.name||'Compte WhatsApp AngelCare'):(contact.display_name||contact.phone_number_e164||'Contact WhatsApp')
   const senderType=normalized.fromMe?'whatsapp_account':'contact'
   const preview=String(normalized.preview||'').slice(0,240)
   if(!conv.data){const created=await supabase.from('ac_whatsapp_conversations').insert({account_id:account.id,contact_id:contact.id,remote_chat_id:remote,queue_id:queueId,status:normalized.fromMe?'waiting_customer':'new',priority:'normal',unread_count:normalized.fromMe?0:1,message_count:1,last_message_preview:preview||null,last_message_direction:normalized.fromMe?'outbound':'inbound',last_message_at:normalized.timestamp,last_message_sender_display_name_snapshot:senderDisplayName,last_message_sender_type:senderType,sla_first_response_due_at:new Date(Date.now()+15*60000).toISOString(),sla_resolution_due_at:new Date(Date.now()+240*60000).toISOString()}).select('*').single();if(created.error)throw created.error;conv=created}else{const updates:any={contact_id:contact.id,last_message_preview:preview||conv.data.last_message_preview||null,last_message_direction:normalized.fromMe?'outbound':'inbound',last_message_at:normalized.timestamp,last_message_sender_display_name_snapshot:senderDisplayName,last_message_sender_type:senderType,message_count:(conv.data.message_count||0)+1,status:normalized.fromMe?'waiting_customer':['closed','resolved','archived'].includes(conv.data.status)?'reopened':conv.data.status,unread_count:normalized.fromMe?conv.data.unread_count||0:(conv.data.unread_count||0)+1};await supabase.from('ac_whatsapp_conversations').update(updates).eq('id',conv.data.id)}
   let campaignIdentity:any=null
   if(normalized.fromMe&&normalized.externalMessageId){const campaignLink=await supabase.from('ac_whatsapp_campaign_recipients').select('campaign_id,campaign:ac_whatsapp_campaigns(name,owner_user_id)').eq('external_message_id',normalized.externalMessageId).maybeSingle();if(!campaignLink.error)campaignIdentity=campaignLink.data}
   const insert=await supabase.from('ac_whatsapp_messages').insert({account_id:account.id,conversation_id:conv.data.id,contact_id:contact.id,external_message_id:normalized.externalMessageId,direction:normalized.fromMe?'outbound':'inbound',message_type:normalized.type==='unknown'?'text':normalized.type,body:normalized.body||null,caption:normalized.caption||null,quoted_external_message_id:normalized.message?.quotedMessage?.id||null,status:normalized.fromMe?'sent':'received',sender_whatsapp_id:normalized.from,recipient_whatsapp_id:normalized.to,sender_display_name_snapshot:campaignIdentity?.campaign?.name?`Campagne · ${campaignIdentity.campaign.name}`:senderDisplayName,sender_role_snapshot:normalized.fromMe?(campaignIdentity?'Automatisation commerciale':'Compte WhatsApp mobile'):'Contact',sender_type:campaignIdentity?'automation':senderType,message_origin:campaignIdentity?'campaign':'whatsapp_webhook',campaign_id:campaignIdentity?.campaign_id||null,campaign_name_snapshot:campaignIdentity?.campaign?.name||null,responsible_user_id:campaignIdentity?.campaign?.owner_user_id||null,raw_payload:safeRawPayload(payload),sent_at:normalized.fromMe?normalized.timestamp:null,received_at:normalized.fromMe?null:normalized.timestamp,created_at:normalized.timestamp}).select('id').single();if(insert.error)throw insert.error
   await persistMedia(supabase,{accountId:account.id,conversationId:conv.data.id,messageId:insert.data.id,externalId:normalized.externalMessageId,media:mediaEnvelope(normalized),hasMedia:normalized.hasMedia,sessionId:sid,chatId:remote})
   if(!normalized.fromMe){const recent=await supabase.from('ac_whatsapp_campaign_recipients').select('id,campaign_id,external_message_id').eq('contact_id',contact.id).in('status',['sent','delivered','read']).order('sent_at',{ascending:false}).limit(1).maybeSingle();if(recent.error)throw recent.error;if(recent.data)await supabase.from('ac_whatsapp_campaign_recipients').update({status:'replied',replied_at:normalized.timestamp}).eq('id',recent.data.id)}
  }
  await markWebhook(supabase,deliveryId,'processed')
  return ok({processed:true,eventType})
 }catch(cause){const message=cause instanceof Error?cause.message:String(cause);await markWebhook(supabase,deliveryId,'failed',message);await supabase.from('ac_whatsapp_security_events').insert({severity:'high',event_type:'webhook.processing_failed',title:'Échec de traitement webhook OpenWA',description:message,account_id:null,metadata:{eventType,deliveryId,sessionId:sid}});return fail('WEBHOOK_PROCESSING_FAILED',500,message)}
}
