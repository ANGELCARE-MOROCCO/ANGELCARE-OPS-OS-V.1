import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

const TRIGGERS = new Set(['inbound_message','new_conversation','first_inbound','keyword','outside_business_hours'])

function normalize(row:any){
  return {
    name:String(row.name||row.title||'').trim(),
    trigger_type:String(row.trigger_type||'inbound_message'),
    template_id:String(row.template_id||''),
    account_id:row.account_id||null,
    priority:Number(row.priority||100),
    cooldown_seconds:Number(row.cooldown_seconds||300),
    max_runs_per_conversation:Number(row.max_runs_per_conversation||1),
    keywords:String(row.keywords||'').split(/[|;,]/).map((v:string)=>v.trim()).filter(Boolean),
    description:String(row.description||'').trim()||null,
  }
}

export async function GET(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage');if('error'in context)return context.error
  const jobs=await context.supabase.from('ac_whatsapp_import_jobs').select('*').eq('import_type','automation_rules').order('created_at',{ascending:false}).limit(50)
  if(jobs.error)return fail(jobs.error.message,500)
  return ok(jobs.data||[])
}

export async function POST(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage');if('error'in context)return context.error
  const b=await request.json().catch(()=>({}))

  if(b.action==='rollback'){
    const jobId=String(b.job_id||'');const reason=String(b.reason||'').trim();if(!jobId)return fail('JOB_ID_REQUIRED',422);if(!reason)return fail('ROLLBACK_REASON_REQUIRED',422)
    const job=await context.supabase.from('ac_whatsapp_import_jobs').select('*').eq('id',jobId).eq('import_type','automation_rules').maybeSingle();if(job.error)return fail(job.error.message,500);if(!job.data)return fail('IMPORT_JOB_NOT_FOUND',404);if(job.data.status!=='committed')return fail('IMPORT_NOT_ROLLBACKABLE',409)
    const rows=await context.supabase.from('ac_whatsapp_import_rows').select('*').eq('import_job_id',jobId).eq('entity_type','automation_rule');if(rows.error)return fail(rows.error.message,500)
    const ids=(rows.data||[]).filter((row:any)=>row.entity_action==='created'&&row.entity_id).map((row:any)=>row.entity_id)
    if(ids.length){const archived=await context.supabase.from('ac_whatsapp_automation_rules').update({status:'archived',approval_status:'draft',test_mode:true,archived_at:new Date().toISOString(),updated_by:context.user.id}).in('id',ids);if(archived.error)return fail(archived.error.message,500)}
    await context.supabase.from('ac_whatsapp_import_rows').update({disposition:'rolled_back'}).eq('import_job_id',jobId)
    const updated=await context.supabase.from('ac_whatsapp_import_jobs').update({status:'rolled_back',rolled_back_by:context.user.id,rolled_back_at:new Date().toISOString(),metadata:{...(job.data.metadata||{}),rollback_reason:reason}}).eq('id',jobId).select('*').single();if(updated.error)return fail(updated.error.message,500)
    await audit(context,{action:'automation.import.rollback',entityType:'import_job',entityId:jobId,reason,newState:{archived_rules:ids.length}});return ok(updated.data)
  }

  const rows=Array.isArray(b.rows)?b.rows:[]
  if(!rows.length||rows.length>2000)return fail('ROWS_REQUIRED_OR_TOO_MANY',422)
  const templates=await context.supabase.from('ac_whatsapp_templates').select('id,name,status,approval_status').limit(5000);if(templates.error)return fail(templates.error.message,500)
  const validTemplate=new Set((templates.data||[]).filter((row:any)=>row.status==='active'&&row.approval_status==='approved').map((row:any)=>String(row.id)))
  const analysis=rows.map((raw:any,index:number)=>{
    const n=normalize(raw);const messages:string[]=[];let disposition:'valid'|'warning'|'rejected'='valid'
    if(!n.name){messages.push('NAME_REQUIRED');disposition='rejected'}
    if(!TRIGGERS.has(n.trigger_type)){messages.push('UNSUPPORTED_TRIGGER');disposition='rejected'}
    if(!validTemplate.has(n.template_id)){messages.push('APPROVED_TEMPLATE_NOT_FOUND');disposition='rejected'}
    if(n.trigger_type==='keyword'&&!n.keywords.length){messages.push('KEYWORDS_REQUIRED');disposition='rejected'}
    if(n.cooldown_seconds<0||n.max_runs_per_conversation<1){messages.push('INVALID_LIMITS');disposition='rejected'}
    return{row_number:index+1,raw_row:raw,normalized_row:n,disposition,messages}
  })
  const summary={total:analysis.length,valid:analysis.filter((x:any)=>x.disposition==='valid').length,warnings:analysis.filter((x:any)=>x.disposition==='warning').length,rejected:analysis.filter((x:any)=>x.disposition==='rejected').length}
  if(!b.commit)return ok({mode:'preview',summary,rows:analysis})
  if(summary.rejected)return fail('IMPORT_HAS_REJECTED_ROWS',409,{summary,rows:analysis.filter((x:any)=>x.disposition==='rejected')})

  const job=await context.supabase.from('ac_whatsapp_import_jobs').insert({import_type:'automation_rules',file_name:b.file_name||null,status:'validated',total_rows:summary.total,valid_rows:summary.valid,warning_rows:summary.warnings,rejected_rows:summary.rejected,created_by:context.user.id}).select('*').single();if(job.error)return fail(job.error.message,500)
  for(const item of analysis){
    const n=item.normalized_row
    const code=`import-${n.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)}-${crypto.randomUUID().slice(0,6)}`
    const ins=await context.supabase.from('ac_whatsapp_automation_rules').insert({code,name:n.name,description:n.description,trigger_type:n.trigger_type,conditions:{keywords:n.keywords},actions:[{type:'send_template',template_id:n.template_id}],template_id:n.template_id,account_id:n.account_id,priority:n.priority,cooldown_seconds:n.cooldown_seconds,max_runs_per_conversation:n.max_runs_per_conversation,status:'draft',approval_status:'draft',test_mode:true,created_by:context.user.id,updated_by:context.user.id}).select('*').single();if(ins.error)return fail(ins.error.message,500)
    await context.supabase.from('ac_whatsapp_import_rows').insert({import_job_id:job.data.id,row_number:item.row_number,raw_row:item.raw_row,normalized_row:n,disposition:'committed',messages:item.messages,entity_type:'automation_rule',entity_id:ins.data.id,entity_action:'created'})
  }
  const done=await context.supabase.from('ac_whatsapp_import_jobs').update({status:'committed',created_count:analysis.length,committed_by:context.user.id,committed_at:new Date().toISOString()}).eq('id',job.data.id).select('*').single();if(done.error)return fail(done.error.message,500)
  await audit(context,{action:'automation.import.commit',entityType:'import_job',entityId:job.data.id,newState:{summary}})
  return ok({job:done.data,summary},{status:201})
}
