import { NextRequest } from 'next/server'
import { acContext, audit, fail, hasAccountCapability, ok } from '@/lib/ac-whatsapp/server'
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const context=await acContext(request,'ac-whatsapp.campaign.launch');if('error'in context)return context.error;const {id}=await params;const body=await request.json().catch(()=>({}));const action=String(body.action||'');if(!['pause','resume','cancel'].includes(action))return fail('INVALID_ACTION',422)
 const campaign=await context.supabase.from('ac_whatsapp_campaigns').select('*').eq('id',id).maybeSingle();if(campaign.error)return fail(campaign.error.message,500);if(!campaign.data)return fail('CAMPAIGN_NOT_FOUND',404);if(!hasAccountCapability(context,campaign.data.account_id,'campaign'))return fail('ACCOUNT_CAMPAIGN_ACCESS_DENIED',403)
 const status=action==='pause'?'paused':action==='resume'?'running':'cancelled';const result=await context.supabase.from('ac_whatsapp_campaigns').update({status,updated_by:context.user.id}).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500)
 if(action==='pause')await context.supabase.from('ac_whatsapp_outbox').update({status:'scheduled'}).eq('campaign_id',id).eq('status','queued')
 if(action==='resume')await context.supabase.from('ac_whatsapp_outbox').update({status:'queued',available_at:new Date().toISOString()}).eq('campaign_id',id).eq('status','scheduled')
 if(action==='cancel'){await Promise.all([context.supabase.from('ac_whatsapp_outbox').update({status:'cancelled'}).eq('campaign_id',id).in('status',['queued','scheduled']),context.supabase.from('ac_whatsapp_campaign_recipients').update({status:'cancelled'}).eq('campaign_id',id).in('status',['pending','queued','processing'])])}
 await audit(context,{action:`campaign.${action}`,entityType:'campaign',entityId:id,newState:{status}});return ok(result.data)
}
