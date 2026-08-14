import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const context=await acContext(request,'ac-whatsapp.automation.manage')
  if('error' in context)return context.error
  const {id}=await params
  const body=await request.json().catch(()=>({}))
  const allowed=['name','description','service_line','customer_type','status','default_goal','commercial_priority','applicability_score','coverage_score','maturity_level']
  const patch:any={updated_by:context.user.id,updated_at:new Date().toISOString()}
  for(const key of allowed)if(Object.prototype.hasOwnProperty.call(body,key))patch[key]=body[key]
  if(body.action==='publish'){patch.status='active';patch.version=Number(body.version||1)+1}
  if(body.action==='pause')patch.status='paused'
  if(body.action==='archive')patch.status='archived'
  const before=await context.supabase.from('ac_whatsapp_ri_doctrine_packs').select('*').eq('id',id).maybeSingle()
  if(before.error)return fail(before.error.message,500);if(!before.data)return fail('DOCTRINE_PACK_NOT_FOUND',404)
  const updated=await context.supabase.from('ac_whatsapp_ri_doctrine_packs').update(patch).eq('id',id).select('*').single()
  if(updated.error)return fail(updated.error.message,500)
  await audit(context,{action:'revenue.doctrine_pack.update',entityType:'ri_doctrine_pack',entityId:id,previousState:before.data,newState:updated.data,reason:String(body.reason||'Doctrine governance update')})
  return ok(updated.data)
}
