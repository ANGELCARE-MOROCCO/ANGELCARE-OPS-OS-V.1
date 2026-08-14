import { NextRequest } from 'next/server'
import { acContext, fail, ok } from '@/lib/ac-whatsapp/server'
import { buildRevenueContext } from '@/lib/ac-whatsapp/revenue-intelligence/scoring'
import { decideRevenueAction } from '@/lib/ac-whatsapp/revenue-intelligence/doctrine-engine'
import { loadDoctrinePacks } from '@/lib/ac-whatsapp/revenue-intelligence/repository'

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const context=await acContext(request,'ac-whatsapp.automation.manage')
  if('error' in context)return context.error
  const {id}=await params;const body=await request.json().catch(()=>({}))
  const text=String(body.message||'').trim();if(!text)return fail('SIMULATION_MESSAGE_REQUIRED',422)
  try{
    const packs=await loadDoctrinePacks(context.supabase,id)
    const syntheticConversation={id:crypto.randomUUID(),message_count:Number(body.message_count||1),last_message_preview:text,metadata:body.metadata||{}}
    const syntheticContact={display_name:body.contact_name||'Contact test',organization_name:body.organization_name||null,contact_type:body.customer_type||'unknown',lead_stage:body.journey_stage||null,tags:body.tags||[],city:body.city||null}
    const messages=[{direction:'inbound',body:text,created_at:new Date().toISOString()}]
    const revenueContext=buildRevenueContext({conversation:syntheticConversation,contact:syntheticContact,account:{status:'connected'},messages,source:body.source||'simulation'})
    const decision=decideRevenueAction({packs,context:revenueContext,commercialIntensityCap:5})
    const inserted=await context.supabase.from('ac_whatsapp_ri_simulations').insert({pack_id:id,input:{message:text,...body},output:{context:revenueContext,decision},verdict:decision.confidence>=.75?'ready':decision.confidence>=.5?'review':'weak',created_by:context.user.id}).select('*').single()
    if(inserted.error)return fail(inserted.error.message,500)
    return ok(inserted.data,{status:201})
  }catch(cause){return fail('SIMULATION_FAILED',500,cause instanceof Error?cause.message:String(cause))}
}
