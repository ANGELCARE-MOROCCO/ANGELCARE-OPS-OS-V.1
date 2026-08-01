import { NextRequest } from 'next/server'
import { acContext, audit, canAccessConversationRow, fail, hasAccountCapability, normalizePhone, ok, phoneToChatId, scopeAccountRows } from '@/lib/ac-whatsapp/server'

export async function GET(request: NextRequest) {
  const context = await acContext(request,'ac-whatsapp.inbox.view')
  if ('error' in context) return context.error
  const url = new URL(request.url)
  const status=url.searchParams.get('status'), queueId=url.searchParams.get('queueId'), accountId=url.searchParams.get('accountId'), search=url.searchParams.get('search')
  if (accountId && !context.access.global && !context.access.accountIds.includes(accountId)) return fail('ACCOUNT_ACCESS_DENIED',403)
  if (queueId && !context.access.global && !context.access.broadConversations && !context.access.queueIds.includes(queueId)) return fail('QUEUE_ACCESS_DENIED',403)

  let query:any = scopeAccountRows(context.supabase.from('ac_whatsapp_conversations').select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*),queue:ac_whatsapp_queues(*),labels:ac_whatsapp_conversation_labels(label:ac_whatsapp_labels(*))'),context)
    .order('last_message_at',{ascending:false,nullsFirst:false}).limit(1000)
  if(status) query=query.eq('status',status)
  if(queueId) query=query.eq('queue_id',queueId)
  if(accountId) query=query.eq('account_id',accountId)
  const result=await query
  if(result.error)return fail(result.error.message,500)
  let rows=(result.data||[]).filter((r:any)=>canAccessConversationRow(context,r))
  if(search){const q=search.toLowerCase();rows=rows.filter((r:any)=>[r.contact?.display_name,r.contact?.organization_name,r.contact?.phone_number_e164,r.last_message_preview].some(v=>String(v||'').toLowerCase().includes(q)))}
  return ok(rows.slice(0,500))
}

export async function POST(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.message.send');if('error'in context)return context.error;const body=await request.json().catch(()=>({}));const accountId=String(body.account_id||'')
 if(!accountId)return fail('ACCOUNT_REQUIRED',422);if(!hasAccountCapability(context,accountId,'send'))return fail('ACCOUNT_SEND_ACCESS_DENIED',403)
 let contact:any=null
 if(body.contact_id){const result=await context.supabase.from('ac_whatsapp_contacts').select('*').eq('id',String(body.contact_id)).maybeSingle();if(result.error)return fail(result.error.message,500);contact=result.data}
 else if(body.phone_number_e164||body.phone){const phone=normalizePhone(body.phone_number_e164||body.phone);if(!phone)return fail('VALID_PHONE_REQUIRED',422);const result=await context.supabase.from('ac_whatsapp_contacts').upsert({whatsapp_id:phoneToChatId(phone),phone_number_e164:phone,display_name:body.display_name||body.name||phone,organization_name:body.organization_name||null,contact_type:body.contact_type||'prospect',preferred_language:body.preferred_language||'fr',city:body.city||null,lead_stage:body.lead_stage||'new',priority:body.priority||'normal',tags:Array.isArray(body.tags)?body.tags:[],created_by:context.user.id,updated_by:context.user.id},{onConflict:'whatsapp_id'}).select('*').single();if(result.error)return fail(result.error.message,500);contact=result.data}
 if(!contact)return fail('CONTACT_REQUIRED',422)
 const existing=await context.supabase.from('ac_whatsapp_conversations').select('*').eq('account_id',accountId).eq('remote_chat_id',contact.whatsapp_id).maybeSingle();if(existing.error)return fail(existing.error.message,500);if(existing.data)return ok(existing.data)
 const assigned=body.assign_to_me!==false;const result=await context.supabase.from('ac_whatsapp_conversations').insert({account_id:accountId,contact_id:contact.id,remote_chat_id:contact.whatsapp_id,queue_id:body.queue_id||null,assigned_user_id:assigned?context.user.id:null,status:assigned?'assigned':'unassigned',priority:body.priority||contact.priority||'normal',subject:body.subject||null,last_message_preview:'Nouvelle conversation',last_message_at:new Date().toISOString()}).select('*').single();if(result.error)return fail(result.error.message,500)
 await context.supabase.from('ac_whatsapp_conversation_events').insert({conversation_id:result.data.id,event_type:'conversation.created',actor_user_id:context.user.id,new_state:result.data,reason:body.reason||'Ouverture manuelle'})
 await audit(context,{action:'conversation.create',entityType:'conversation',entityId:result.data.id,newState:result.data});return ok(result.data,{status:201})
}
