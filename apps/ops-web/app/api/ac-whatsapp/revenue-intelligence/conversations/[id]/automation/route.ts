import { NextRequest } from 'next/server'
import { acContext, audit, canAccessConversationRow, fail, ok } from '@/lib/ac-whatsapp/server'
import { ensureConversationRevenueState } from '@/lib/ac-whatsapp/revenue-intelligence/repository'

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const context=await acContext(request,'ac-whatsapp.inbox.view');if('error' in context)return context.error;const {id}=await params
  const conv=await context.supabase.from('ac_whatsapp_conversations').select('*').eq('id',id).maybeSingle();if(conv.error)return fail(conv.error.message,500);if(!conv.data)return fail('CONVERSATION_NOT_FOUND',404);if(!canAccessConversationRow(context,conv.data))return fail('CONVERSATION_ACCESS_DENIED',403)
  const state=await ensureConversationRevenueState(context.supabase,{conversationId:id,mode:conv.data.automation_mode||'manual',packId:conv.data.automation_doctrine_pack_id,userId:context.user.id})
  const packs=await context.supabase.from('ac_whatsapp_ri_doctrine_packs').select('id,name,status,maturity_level,applicability_score,coverage_score,default_goal').in('status',['active','validated']).order('commercial_priority',{ascending:false})
  if(packs.error)return fail(packs.error.message,500)
  return ok({conversation:conv.data,state,packs:packs.data||[]})
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const context=await acContext(request,'ac-whatsapp.message.send');if('error' in context)return context.error;const {id}=await params;const body=await request.json().catch(()=>({}))
  const conv=await context.supabase.from('ac_whatsapp_conversations').select('*').eq('id',id).maybeSingle();if(conv.error)return fail(conv.error.message,500);if(!conv.data)return fail('CONVERSATION_NOT_FOUND',404);if(!canAccessConversationRow(context,conv.data))return fail('CONVERSATION_ACCESS_DENIED',403)
  const paused=Object.prototype.hasOwnProperty.call(body,'paused')?Boolean(body.paused):Boolean(conv.data.automation_paused)
  const mode=String(body.mode||(!paused?'selected_auto':'manual'))
  const allowed=['manual','assist','selected_auto','account_auto','protected'];if(!allowed.includes(mode))return fail('INVALID_AUTOMATION_MODE',422)
  const packId=body.doctrine_pack_id?String(body.doctrine_pack_id):conv.data.automation_doctrine_pack_id||null
  const goal=body.goal?String(body.goal):conv.data.automation_goal||null
  const excluded=body.excluded===true||mode==='protected'
  const patch={automation_paused:paused,automation_mode:mode,automation_doctrine_pack_id:packId,automation_goal:goal,automation_excluded:excluded,updated_at:new Date().toISOString()}
  const updated=await context.supabase.from('ac_whatsapp_conversations').update(patch).eq('id',id).select('*').single();if(updated.error)return fail(updated.error.message,500)
  const existing=await ensureConversationRevenueState(context.supabase,{conversationId:id,mode,packId,goal,userId:context.user.id})
  const state=await context.supabase.from('ac_whatsapp_ri_conversation_state').update({mode,doctrine_pack_id:packId,current_goal:goal,excluded,takeover_reason:paused?String(body.reason||'Human takeover'):null,paused_at:paused?new Date().toISOString():null,enabled_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',existing.id).select('*').single();if(state.error)return fail(state.error.message,500)
  await audit(context,{action:'revenue.conversation.autonomy',entityType:'conversation',entityId:id,previousState:{automation_paused:conv.data.automation_paused,automation_mode:conv.data.automation_mode},newState:patch,reason:String(body.reason||'Live Command automation control')})
  return ok({conversation:updated.data,state:state.data})
}
