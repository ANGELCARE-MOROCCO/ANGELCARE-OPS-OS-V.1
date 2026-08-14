import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
import { recordMaturityEvent } from '@/lib/ac-whatsapp/revenue-intelligence/maturity'

export async function POST(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage');if('error' in context)return context.error;const body=await request.json().catch(()=>({}))
  const conversationId=String(body.conversation_id||'');const eventType=String(body.event_type||'');if(!conversationId||!eventType)return fail('LEARNING_EVENT_REQUIRED',422)
  const decisionId=body.decision_id?String(body.decision_id):null
  const inserted=await context.supabase.from('ac_whatsapp_ri_learning_events').insert({conversation_id:conversationId,decision_id:decisionId,event_type:eventType,rating:body.rating==null?null:Number(body.rating),correction:String(body.correction||'')||null,metadata:body.metadata||{},created_by:context.user.id}).select('*').single();if(inserted.error)return fail(inserted.error.message,500)
  if(decisionId){const decision=await context.supabase.from('ac_whatsapp_ri_decisions').select('doctrine_node_ids').eq('id',decisionId).maybeSingle();if(!decision.error&&decision.data){const mapped=eventType==='good_response'?'success':eventType==='conversion'?'conversion':['wrong_reasoning','wrong_tone','missed_sales_opportunity','too_aggressive','too_passive','should_escalate'].includes(eventType)?'override':'sample';for(const nodeId of decision.data.doctrine_node_ids||[])await recordMaturityEvent(context.supabase,{dimensionType:'doctrine_node',dimensionKey:String(nodeId),event:mapped as any,metadata:{learningEventId:inserted.data.id,eventType}}).catch(()=>null)}}
  await audit(context,{action:'revenue.learning.feedback',entityType:'ri_learning_event',entityId:inserted.data.id,newState:{conversationId,decisionId,eventType}})
  return ok(inserted.data,{status:201})
}
