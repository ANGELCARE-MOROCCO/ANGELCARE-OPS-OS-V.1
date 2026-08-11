import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok, scopeQueueRows } from '@/lib/ac-whatsapp/server'
export async function GET(request:NextRequest){const context=await acContext(request,'ac-whatsapp.view');if('error'in context)return context.error;const result=await scopeQueueRows(context.supabase.from('ac_whatsapp_queues').select('*,members:ac_whatsapp_queue_memberships(*)'),context).order('priority',{ascending:false});if(result.error)return fail(result.error.message,500);return ok(result.data||[])}
export async function POST(request:NextRequest){const context=await acContext(request,'ac-whatsapp.members.manage');if('error'in context)return context.error;const b=await request.json().catch(()=>({}));if(!b.name)return fail('QUEUE_NAME_REQUIRED',422);const code=String(b.code||b.name).toLowerCase().replace(/[^a-z0-9]+/g,'-');const result=await context.supabase.from('ac_whatsapp_queues').insert({code,name:b.name,department:b.department||null,description:b.description||null,color:b.color||'#059669',priority:Number(b.priority||50),routing_mode:b.routing_mode||'least_loaded',sla_first_response_minutes:Number(b.sla_first_response_minutes||15),sla_resolution_minutes:Number(b.sla_resolution_minutes||240),created_by:context.user.id,updated_by:context.user.id}).select('*').single();if(result.error)return fail(result.error.message,500);await audit(context,{action:'queue.create',entityType:'queue',entityId:result.data.id,newState:result.data});return ok(result.data,{status:201})}

export async function PATCH(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.members.manage');if('error'in context)return context.error
  const b=await request.json().catch(()=>({}));const id=String(b.id||'');if(!id)return fail('QUEUE_ID_REQUIRED',422)
  const current=await context.supabase.from('ac_whatsapp_queues').select('*').eq('id',id).maybeSingle();if(current.error)return fail(current.error.message,500);if(!current.data)return fail('QUEUE_NOT_FOUND',404)
  const patch:Record<string,unknown>={updated_by:context.user.id,updated_at:new Date().toISOString()}
  for(const key of ['name','department','description','color','priority','routing_mode','sla_first_response_minutes','sla_resolution_minutes','status'])if(key in b)patch[key]=b[key]
  if(b.action==='archive')patch.status='archived';if(b.action==='restore')patch.status='active'
  const result=await context.supabase.from('ac_whatsapp_queues').update(patch).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500)
  await audit(context,{action:`queue.${b.action||'update'}`,entityType:'queue',entityId:id,previousState:current.data,newState:result.data,reason:b.reason||null});return ok(result.data)
}

export async function DELETE(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.members.manage');if('error'in context)return context.error
  const b=await request.json().catch(()=>({}));const id=String(b.id||'');const reason=String(b.reason||'').trim();if(!id)return fail('QUEUE_ID_REQUIRED',422);if(!reason)return fail('QUEUE_ARCHIVE_REASON_REQUIRED',422)
  const open=await context.supabase.from('ac_whatsapp_conversations').select('id',{count:'exact',head:true}).eq('queue_id',id).not('status','in','(resolved,closed,archived)');if(open.error)return fail(open.error.message,500);if((open.count||0)>0)return fail('QUEUE_ARCHIVE_BLOCKED',409,{openConversations:open.count})
  const current=await context.supabase.from('ac_whatsapp_queues').select('*').eq('id',id).maybeSingle();if(current.error)return fail(current.error.message,500);if(!current.data)return fail('QUEUE_NOT_FOUND',404)
  const result=await context.supabase.from('ac_whatsapp_queues').update({status:'archived',updated_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500)
  await audit(context,{action:'queue.archive',entityType:'queue',entityId:id,previousState:current.data,newState:result.data,reason});return ok(result.data)
}
