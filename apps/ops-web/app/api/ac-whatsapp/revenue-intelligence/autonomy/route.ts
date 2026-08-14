import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

export async function GET(request:NextRequest){const context=await acContext(request,'ac-whatsapp.view');if('error' in context)return context.error;const rows=await context.supabase.from('ac_whatsapp_ri_engine_settings').select('*').order('scope_type');if(rows.error)return fail(rows.error.message,500);return ok(rows.data||[])}

export async function PATCH(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage');if('error' in context)return context.error
  const body=await request.json().catch(()=>({}));const scopeType=String(body.scope_type||'global');const scopeId=body.scope_id?String(body.scope_id):null
  const payload:any={scope_type:scopeType,scope_id:scopeId,autonomy_mode:String(body.autonomy_mode||'manual'),enabled:body.enabled!==false,min_autonomy_confidence:Math.max(.4,Math.min(.99,Number(body.min_autonomy_confidence||.82))),min_assist_confidence:Math.max(.2,Math.min(.95,Number(body.min_assist_confidence||.55))),commercial_intensity_cap:Math.max(0,Math.min(6,Number(body.commercial_intensity_cap||5))),after_hours_start:String(body.after_hours_start||'19:00'),after_hours_end:String(body.after_hours_end||'08:00'),timezone:String(body.timezone||'Africa/Casablanca'),overflow_threshold:Math.max(1,Number(body.overflow_threshold||25)),updated_by:context.user.id,updated_at:new Date().toISOString()}
  const found=scopeId?await context.supabase.from('ac_whatsapp_ri_engine_settings').select('id').eq('scope_type',scopeType).eq('scope_id',scopeId).maybeSingle():await context.supabase.from('ac_whatsapp_ri_engine_settings').select('id').eq('scope_type',scopeType).is('scope_id',null).maybeSingle()
  if(found.error)return fail(found.error.message,500)
  const result=found.data?.id?await context.supabase.from('ac_whatsapp_ri_engine_settings').update(payload).eq('id',found.data.id).select('*').single():await context.supabase.from('ac_whatsapp_ri_engine_settings').insert(payload).select('*').single()
  if(result.error)return fail(result.error.message,500)
  await audit(context,{action:'revenue.autonomy.configure',entityType:'ri_engine_settings',entityId:result.data.id,newState:result.data,reason:String(body.reason||'Autonomy policy update')})
  return ok(result.data)
}
