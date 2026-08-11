import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

function codeOf(value: unknown) { const base=String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80); return base || `rule-${crypto.randomUUID().slice(0,8)}` }
const TRIGGERS = new Set(['inbound_message','new_conversation','first_inbound','keyword','outside_business_hours'])

export async function GET(request: NextRequest) {
  const context=await acContext(request,'ac-whatsapp.view'); if('error'in context)return context.error
  const rules=await context.supabase.from('ac_whatsapp_automation_rules').select('*,template:ac_whatsapp_templates(*),category:ac_whatsapp_response_categories(*),account:ac_whatsapp_accounts(id,name,phone_number_e164)').order('priority').order('updated_at',{ascending:false}).limit(1000)
  if(rules.error)return fail(rules.error.message,500)
  const executions=await context.supabase.from('ac_whatsapp_automation_executions').select('*').order('created_at',{ascending:false}).limit(200)
  if(executions.error&&executions.error.code!=='42P01')return fail(executions.error.message,500)
  return ok({rules:rules.data||[],executions:executions.data||[]})
}

export async function POST(request: NextRequest) {
  const context=await acContext(request,'ac-whatsapp.automation.manage'); if('error'in context)return context.error
  const b=await request.json().catch(()=>({})); const name=String(b.name||'').trim(); const trigger=String(b.trigger_type||'inbound_message')
  if(!name)return fail('RULE_NAME_REQUIRED',422); if(!TRIGGERS.has(trigger))return fail('UNSUPPORTED_TRIGGER',422); if(!b.template_id)return fail('TEMPLATE_REQUIRED',422)
  const payload={code:codeOf(b.code||name),name,description:String(b.description||'').trim()||null,trigger_type:trigger,conditions:b.conditions&&typeof b.conditions==='object'?b.conditions:{},actions:[{type:'send_template',template_id:b.template_id}],category_id:b.category_id||null,account_id:b.account_id||null,template_id:b.template_id,priority:Number(b.priority||100),cooldown_seconds:Math.max(0,Number(b.cooldown_seconds||300)),max_runs_per_conversation:Math.max(1,Number(b.max_runs_per_conversation||1)),schedule_config:b.schedule_config&&typeof b.schedule_config==='object'?b.schedule_config:{},human_takeover_policy:'pause',status:'draft',approval_status:'draft',test_mode:true,created_by:context.user.id,updated_by:context.user.id}
  const result=await context.supabase.from('ac_whatsapp_automation_rules').insert(payload).select('*').single();if(result.error)return fail(result.error.message,500)
  await audit(context,{action:'automation.create',entityType:'automation_rule',entityId:result.data.id,newState:result.data});return ok(result.data,{status:201})
}

export async function PATCH(request: NextRequest) {
  const context=await acContext(request,'ac-whatsapp.automation.manage'); if('error'in context)return context.error
  const b=await request.json().catch(()=>({})); const id=String(b.id||''); if(!id)return fail('RULE_ID_REQUIRED',422)
  const current=await context.supabase.from('ac_whatsapp_automation_rules').select('*').eq('id',id).maybeSingle();if(current.error)return fail(current.error.message,500);if(!current.data)return fail('RULE_NOT_FOUND',404)
  const patch:any={updated_by:context.user.id,updated_at:new Date().toISOString()}
  for(const key of ['name','description','category_id','account_id','template_id','priority','cooldown_seconds','max_runs_per_conversation','schedule_config','conditions']) if(key in b)patch[key]=b[key]
  if('trigger_type'in b){if(!TRIGGERS.has(String(b.trigger_type)))return fail('UNSUPPORTED_TRIGGER',422);patch.trigger_type=b.trigger_type}
  if(b.action==='approve'){patch.approval_status='approved';patch.approved_by=context.user.id;patch.approved_at=new Date().toISOString();patch.status='draft';patch.test_mode=true}
  if(b.action==='activate'){if(current.data.approval_status!=='approved')return fail('RULE_APPROVAL_REQUIRED',409);patch.status='active';patch.test_mode=false}
  if(b.action==='pause')patch.status='paused'
  if(b.action==='resume'){if(current.data.approval_status!=='approved')return fail('RULE_APPROVAL_REQUIRED',409);patch.status='active';patch.test_mode=false}
  if(b.action==='archive'){patch.status='archived';patch.archived_at=new Date().toISOString()}
  if(b.action==='restore'){patch.status='draft';patch.approval_status='draft';patch.test_mode=true;patch.archived_at=null}
  const result=await context.supabase.from('ac_whatsapp_automation_rules').update(patch).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500)
  await audit(context,{action:`automation.${b.action||'update'}`,entityType:'automation_rule',entityId:id,previousState:current.data,newState:result.data,reason:b.reason||null});return ok(result.data)
}

export async function DELETE(request: NextRequest) {
  const context=await acContext(request,'ac-whatsapp.automation.manage'); if('error'in context)return context.error
  const b=await request.json().catch(()=>({})); const id=String(b.id||''); if(!id)return fail('RULE_ID_REQUIRED',422)
  const result=await context.supabase.from('ac_whatsapp_automation_rules').update({status:'archived',archived_at:new Date().toISOString(),updated_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500)
  await audit(context,{action:'automation.archive',entityType:'automation_rule',entityId:id,newState:result.data});return ok(result.data)
}
