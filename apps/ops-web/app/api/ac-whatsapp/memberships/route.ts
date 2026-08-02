import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
export async function GET(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.members.manage');if('error'in context)return context.error
 const [members,users,access,queues]=await Promise.all([
  context.supabase.from('ac_whatsapp_memberships').select('*'),
  context.supabase.from('app_users').select('*'),
  context.supabase.from('ac_whatsapp_account_access').select('*'),
  context.supabase.from('ac_whatsapp_queue_memberships').select('*'),
 ])
 const e=[members,users,access,queues].find(x=>x.error)?.error;if(e)return fail(e.message,500);const map=new Map((users.data||[]).map((x:any)=>[x.id,x]));return ok((members.data||[]).map((x:any)=>({...x,user:map.get(x.user_id)||null,account_access:(access.data||[]).filter((a:any)=>a.user_id===x.user_id),queue_memberships:(queues.data||[]).filter((q:any)=>q.user_id===x.user_id)})))
}
export async function POST(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.members.manage');if('error'in context)return context.error;const b=await request.json().catch(()=>({}));if(!b.user_id)return fail('USER_REQUIRED',422)
 const member=await context.supabase.from('ac_whatsapp_memberships').upsert({user_id:b.user_id,role_key:b.role_key||'operator',status:b.status||'active',permissions:Array.isArray(b.permissions)?b.permissions:[],language:b.language||'fr',supervisor_user_id:b.supervisor_user_id||null,working_hours:b.working_hours||{},created_by:context.user.id,updated_by:context.user.id},{onConflict:'user_id'}).select('*').single();if(member.error)return fail(member.error.message,500)
 if(Array.isArray(b.account_ids)){await context.supabase.from('ac_whatsapp_account_access').delete().eq('user_id',b.user_id);if(b.account_ids.length){const accessResult=await context.supabase.from('ac_whatsapp_account_access').insert(b.account_ids.map((account_id:string)=>({account_id,user_id:b.user_id,access_role:b.role_key||'operator',can_send:b.can_send!==false,can_campaign:b.can_campaign!==false,can_admin:Boolean(b.can_admin),created_by:context.user.id})));if(accessResult.error)return fail(accessResult.error.message,500)}}
 if(Array.isArray(b.queue_ids)){await context.supabase.from('ac_whatsapp_queue_memberships').delete().eq('user_id',b.user_id);if(b.queue_ids.length){const queueResult=await context.supabase.from('ac_whatsapp_queue_memberships').insert(b.queue_ids.map((queue_id:string)=>({queue_id,user_id:b.user_id,skill_level:Number(b.skill_level||50),capacity:Number(b.capacity||25),created_by:context.user.id})));if(queueResult.error)return fail(queueResult.error.message,500)}}
 await audit(context,{action:'membership.upsert',entityType:'membership',entityId:member.data.id,newState:member.data});return ok(member.data,{status:201})
}
