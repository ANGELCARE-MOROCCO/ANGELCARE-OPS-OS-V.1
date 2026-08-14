import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
import { recordOutcomeMaturity } from '@/lib/ac-whatsapp/commercial-cognition/maturity-engine'

export async function POST(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage');if('error' in context)return context.error
  const body=await request.json().catch(()=>({}));const conversationId=String(body.conversation_id||'');const outcome=String(body.outcome||'');if(!conversationId||!outcome)return fail('OUTCOME_REQUIRED',422)
  const row=await context.supabase.from('ac_whatsapp_cc_outcomes').insert({conversation_id:conversationId,outcome,commercial_value:body.commercial_value==null?null:Number(body.commercial_value),currency:String(body.currency||'MAD'),metadata:body.metadata||{},recorded_by:context.user.id}).select('*').single();if(row.error)return fail(row.error.message,500)
  try{await context.supabase.from('ac_whatsapp_cc_learning_evidence').insert({conversation_id:conversationId,event_type:'outcome',outcome,evidence:{commercial_value:body.commercial_value||null,metadata:body.metadata||{}}})}catch{}
  const maturity=await recordOutcomeMaturity(context.supabase,conversationId,outcome,Boolean(body.human_override)).catch(()=>[])
  await audit(context,{action:'commercial-cognition.outcome',entityType:'cc_outcome',entityId:row.data.id,newState:{conversationId,outcome,maturityDimensions:maturity.length}})
  return ok({...row.data,maturityDimensions:maturity.length},{status:201})
}
