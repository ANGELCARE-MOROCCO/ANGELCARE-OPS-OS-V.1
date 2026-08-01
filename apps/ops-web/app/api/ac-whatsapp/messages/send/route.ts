import { NextRequest } from 'next/server'
import { acContext, audit, canAccessConversationRow, fail, hasAccountCapability, ok } from '@/lib/ac-whatsapp/server'
import { openwa } from '@/lib/ac-whatsapp/openwa-client'

const MEDIA_TYPES = new Set(['image','video','audio','document'])
function externalId(sent:any){return String(sent?.messageId?._serialized||sent?.messageId||sent?.id?._serialized||sent?.id||sent?._serialized||'')||null}

export async function POST(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.message.send');if('error'in context)return context.error
 const body=await request.json().catch(()=>({}));const conversationId=String(body.conversationId||'');const text=String(body.text||'').trim();const messageType=String(body.messageType||'text').toLowerCase();const media=body.media&&typeof body.media==='object'?body.media:null
 if(!conversationId)return fail('CONVERSATION_REQUIRED',422)
 if(messageType==='text'&&!text)return fail('TEXT_REQUIRED',422)
 if(messageType!=='text'&&(!MEDIA_TYPES.has(messageType)||!media||(!media.url&&!media.base64)))return fail('VALID_MEDIA_REQUIRED',422)
 if(typeof media?.base64==='string'&&media.base64.length>42_000_000)return fail('MEDIA_TOO_LARGE',413)

 const conv=await context.supabase.from('ac_whatsapp_conversations').select('*,account:ac_whatsapp_accounts(*)').eq('id',conversationId).maybeSingle();if(conv.error)return fail(conv.error.message,500);if(!conv.data)return fail('CONVERSATION_NOT_FOUND',404)
 if(!canAccessConversationRow(context,conv.data)||!hasAccountCapability(context,conv.data.account_id,'send'))return fail('CONVERSATION_ACCESS_DENIED',403)
 const account:any=conv.data.account;if(!account?.openwa_session_id)return fail('ACCOUNT_SESSION_NOT_CONFIGURED',409);if(account.outbound_enabled===false)return fail('ACCOUNT_OUTBOUND_PAUSED',409)

 const clientMessageId=crypto.randomUUID();const now=new Date().toISOString();const caption=String(body.caption||text||media?.caption||'').trim()
 const message=await context.supabase.from('ac_whatsapp_messages').insert({account_id:conv.data.account_id,conversation_id:conversationId,contact_id:conv.data.contact_id,client_message_id:clientMessageId,direction:'outbound',message_type:messageType,body:messageType==='text'?text:null,caption:messageType==='text'?null:caption||null,status:'queued',sender_user_id:context.user.id,recipient_whatsapp_id:conv.data.remote_chat_id,created_at:now}).select('*').single();if(message.error)return fail(message.error.message,500)
 const outbox=await context.supabase.from('ac_whatsapp_outbox').insert({client_message_id:clientMessageId,account_id:conv.data.account_id,conversation_id:conversationId,contact_id:conv.data.contact_id,message_type:messageType,chat_id:conv.data.remote_chat_id,body:messageType==='text'?text:caption||null,media_payload:media,status:'processing',locked_by:'nextjs-direct',locked_at:now,attempt_count:1,created_by:context.user.id}).select('*').single();if(outbox.error)return fail(outbox.error.message,500)
 try{
  const sent:any=messageType==='text'?await openwa.sendText(account.openwa_session_id,conv.data.remote_chat_id,text):await openwa.sendMedia(account.openwa_session_id,messageType,conv.data.remote_chat_id,media,caption)
  const external=externalId(sent);const sentAt=new Date().toISOString();const preview=messageType==='text'?text:`${messageType.toUpperCase()}${caption?`: ${caption}`:''}`
  await Promise.all([
   context.supabase.from('ac_whatsapp_messages').update({status:'sent',external_message_id:external,sent_at:sentAt}).eq('id',message.data.id),
   context.supabase.from('ac_whatsapp_outbox').update({status:'sent',external_message_id:external,locked_at:null,locked_by:null}).eq('id',outbox.data.id),
   context.supabase.from('ac_whatsapp_conversations').update({status:'waiting_customer',last_message_preview:preview,last_message_direction:'outbound',last_message_at:sentAt,message_count:(conv.data.message_count||0)+1}).eq('id',conversationId),
   messageType!=='text'?context.supabase.from('ac_whatsapp_attachments').insert({message_id:message.data.id,storage_provider:media.url?'remote':'inline',source_url:media.url||null,file_name:media.filename||null,mime_type:media.mimetype||null,size_bytes:media.size||null,metadata:{outbound:true}}):Promise.resolve(),
  ])
  await audit(context,{action:'message.send',entityType:'message',entityId:message.data.id,newState:{externalMessageId:external,conversationId,messageType}})
  return ok({...message.data,status:'sent',external_message_id:external,sent_at:sentAt},{status:201})
 }catch(cause){
  const error=cause instanceof Error?cause.message:'OPENWA_SEND_FAILED'
  await Promise.all([
   context.supabase.from('ac_whatsapp_messages').update({status:'queued',error_message:error}).eq('id',message.data.id),
   context.supabase.from('ac_whatsapp_outbox').update({status:'queued',last_error:error,locked_at:null,locked_by:null,available_at:new Date(Date.now()+15000).toISOString()}).eq('id',outbox.data.id),
  ])
  return ok({...message.data,status:'queued',error_message:error},{status:202})
 }
}
