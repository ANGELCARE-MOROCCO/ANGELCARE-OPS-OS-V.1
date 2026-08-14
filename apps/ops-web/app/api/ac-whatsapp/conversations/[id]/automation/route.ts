import { NextRequest } from 'next/server'
import { acContext, audit, canAccessConversationRow, fail, ok } from '@/lib/ac-whatsapp/server'
import { ensureConversationRevenueState } from '@/lib/ac-whatsapp/revenue-intelligence/repository'

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const context=await acContext(request,'ac-whatsapp.message.send');if('error' in context)return context.error
  const {id}=await params;const body=await request.json().catch(()=>({}))
  const conv=await context.supabase.from('ac_whatsapp_conversations').select('*').eq('id',id).maybeSingle();if(conv.error)return fail(conv.error.message,500);if(!conv.data)return fail('CONVERSATION_NOT_FOUND',404);if(!canAccessConversationRow(context,conv.data))return fail('CONVERSATION_ACCESS_DENIED',403)
  const paused=Boolean(body.paused);const mode=String(body.mode||(paused?'manual':'selected_auto'))
  const updated=await context.supabase.from('ac_whatsapp_conversations').update({automation_paused:paused,automation_mode:mode,automation_excluded:false,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(updated.error)return fail(updated.error.message,500)
  const state=await ensureConversationRevenueState(context.supabase,{conversationId:id,mode,userId:context.user.id})
  await context.supabase.from('ac_whatsapp_ri_conversation_state').update({mode,takeover_reason:paused?String(body.reason||'Human takeover'):null,paused_at:paused?new Date().toISOString():null,enabled_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',state.id)
  await audit(context,{action:'revenue.conversation.legacy_automation_toggle',entityType:'conversation',entityId:id,newState:{paused,mode},reason:String(body.reason||'Legacy Live Command toggle')})
  return ok(updated.data)
}
