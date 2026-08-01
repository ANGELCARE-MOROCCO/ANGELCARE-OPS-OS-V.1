import { NextRequest } from 'next/server'
import { acContext, audit, canAccessConversationRow, fail, hasQueueAccess, ok } from '@/lib/ac-whatsapp/server'

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const context=await acContext(request,'ac-whatsapp.inbox.view'); if('error'in context)return context.error; const {id}=await params
 const conversation=await context.supabase.from('ac_whatsapp_conversations').select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*),queue:ac_whatsapp_queues(*),labels:ac_whatsapp_conversation_labels(label:ac_whatsapp_labels(*))').eq('id',id).maybeSingle()
 if(conversation.error)return fail(conversation.error.message,500);if(!conversation.data)return fail('CONVERSATION_NOT_FOUND',404);if(!canAccessConversationRow(context,conversation.data))return fail('CONVERSATION_ACCESS_DENIED',403)
 const [messages,events,links]=await Promise.all([
  context.supabase.from('ac_whatsapp_messages').select('*,attachments:ac_whatsapp_attachments(*)').eq('conversation_id',id).order('created_at',{ascending:true}).limit(2000),
  context.supabase.from('ac_whatsapp_conversation_events').select('*').eq('conversation_id',id).order('created_at',{ascending:false}).limit(250),
  context.supabase.from('ac_whatsapp_context_links').select('*').eq('conversation_id',id).order('linked_at',{ascending:false}),
 ])
 const error=[messages,events,links].find(x=>x.error)?.error;if(error)return fail(error.message,500)
 return ok({conversation:conversation.data,messages:messages.data||[],events:events.data||[],contextLinks:links.data||[]})
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const context=await acContext(request,'ac-whatsapp.inbox.view');if('error'in context)return context.error;const {id}=await params
 const body=await request.json().catch(()=>({}));const allowed=['status','priority','queue_id','assigned_user_id','subject','summary','sentiment','intent','snoozed_until']
 const patch:any=Object.fromEntries(Object.entries(body).filter(([k])=>allowed.includes(k)))
 const permissions=new Set(context.access.permissions)
 const assignmentFields=['queue_id','assigned_user_id']
 const closes=['resolved','closed','archived']
 if(assignmentFields.some(key=>Object.prototype.hasOwnProperty.call(patch,key))&&!permissions.has('ac-whatsapp.conversation.assign'))return fail('ASSIGN_PERMISSION_REQUIRED',403)
 if(Object.prototype.hasOwnProperty.call(patch,'status')&&closes.includes(String(patch.status))&&!permissions.has('ac-whatsapp.conversation.close'))return fail('CLOSE_PERMISSION_REQUIRED',403)
 if(Object.keys(patch).some(key=>!assignmentFields.includes(key)&&key!=='status')&&!permissions.has('ac-whatsapp.conversation.assign')&&!permissions.has('ac-whatsapp.conversation.close'))return fail('UPDATE_PERMISSION_REQUIRED',403)
 const before=await context.supabase.from('ac_whatsapp_conversations').select('*').eq('id',id).maybeSingle();if(before.error)return fail(before.error.message,500);if(!before.data)return fail('CONVERSATION_NOT_FOUND',404);if(!canAccessConversationRow(context,before.data))return fail('CONVERSATION_ACCESS_DENIED',403)
 if(patch.queue_id && !hasQueueAccess(context,patch.queue_id))return fail('QUEUE_ACCESS_DENIED',403)
 if(patch.status==='resolved')patch.resolved_at=new Date().toISOString();if(patch.status==='closed')patch.closed_at=new Date().toISOString()
 const result=await context.supabase.from('ac_whatsapp_conversations').update(patch).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500)
 await context.supabase.from('ac_whatsapp_conversation_events').insert({conversation_id:id,event_type:'conversation.updated',actor_user_id:context.user.id,previous_state:before.data,new_state:result.data,reason:body.reason||null})
 await audit(context,{action:'conversation.update',entityType:'conversation',entityId:id,reason:body.reason,previousState:before.data,newState:result.data})
 return ok(result.data)
}
