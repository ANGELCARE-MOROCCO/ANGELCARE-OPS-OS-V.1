import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'

function normalized(row: any) {
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : String(row.tags || '').split(/[|;]/).map((value:string)=>value.trim()).filter(Boolean)
  const shortcut = String(row.shortcut || '').trim()
  return { title: String(row.title || row.name || '').trim(), body: String(row.body || '').trim(), shortcut: shortcut ? `/${shortcut.replace(/^\/+/, '').toLowerCase().replace(/[^a-z0-9_-]/g,'')}` : null, language: String(row.language || 'fr'), tags, description: String(row.description || '').trim() || null, status: String(row.status || 'draft'), service_line: String(row.service_line || '').trim() || null }
}
function code(value:string,row:number){const base=value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);return base || `imported-response-${row}`}

export async function GET(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.import'); if ('error' in context) return context.error
  const jobs = await context.supabase.from('ac_whatsapp_import_jobs').select('*').eq('import_type','saved_responses').order('created_at',{ascending:false}).limit(100)
  if (jobs.error) return fail(jobs.error.message,500)
  return ok(jobs.data || [])
}

export async function POST(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.responses.import'); if ('error' in context) return context.error
  const b = await request.json().catch(() => ({}))
  if (b.action === 'rollback') {
    const jobId = String(b.job_id || ''); if (!jobId) return fail('JOB_ID_REQUIRED',422)
    const job = await context.supabase.from('ac_whatsapp_import_jobs').select('*').eq('id',jobId).eq('import_type','saved_responses').maybeSingle()
    if (job.error) return fail(job.error.message,500); if (!job.data) return fail('IMPORT_JOB_NOT_FOUND',404); if (job.data.status !== 'committed') return fail('IMPORT_JOB_NOT_COMMITTED',409)
    const rows = await context.supabase.from('ac_whatsapp_import_rows').select('*').eq('import_job_id',jobId).eq('disposition','committed').order('row_number',{ascending:false})
    if (rows.error) return fail(rows.error.message,500)
    for (const row of rows.data || []) {
      if (row.entity_action === 'created' && row.entity_id) {
        const archived = await context.supabase.from('ac_whatsapp_templates').update({status:'archived',archived_at:new Date().toISOString(),archived_by:context.user.id,updated_by:context.user.id}).eq('id',row.entity_id)
        if (archived.error) return fail(archived.error.message,500)
      } else if (row.entity_action === 'updated' && row.entity_id && row.previous_state) {
        const previous = { ...row.previous_state, updated_by: context.user.id, updated_at: new Date().toISOString() }
        delete previous.id; delete previous.created_at
        const restored = await context.supabase.from('ac_whatsapp_templates').update(previous).eq('id',row.entity_id)
        if (restored.error) return fail(restored.error.message,500)
      }
      await context.supabase.from('ac_whatsapp_import_rows').update({disposition:'rolled_back'}).eq('id',row.id)
    }
    const rolled = await context.supabase.from('ac_whatsapp_import_jobs').update({status:'rolled_back',rolled_back_by:context.user.id,rolled_back_at:new Date().toISOString()}).eq('id',jobId).select('*').single()
    if (rolled.error) return fail(rolled.error.message,500)
    await audit(context,{action:'responses.import.rollback',entityType:'import_job',entityId:jobId,previousState:job.data,newState:rolled.data,reason:String(b.reason||'Rollback import')})
    return ok(rolled.data)
  }

  const rows = Array.isArray(b.rows) ? b.rows : []; const categoryId = String(b.category_id || ''); const commit = b.commit === true
  if (!categoryId) return fail('CATEGORY_REQUIRED', 422); if (!rows.length || rows.length > 5000) return fail('ROWS_REQUIRED_OR_TOO_MANY', 422)
  const category = await context.supabase.from('ac_whatsapp_response_categories').select('*').eq('id', categoryId).maybeSingle(); if (category.error) return fail(category.error.message, 500); if (!category.data) return fail('CATEGORY_NOT_FOUND', 404)
  const existing = await context.supabase.from('ac_whatsapp_templates').select('*').limit(10000); if (existing.error) return fail(existing.error.message, 500)
  const byTitle = new Map((existing.data || []).map((row:any)=>[String(row.name||'').toLowerCase(),row])); const byShortcut = new Map((existing.data || []).filter((row:any)=>row.shortcut).map((row:any)=>[String(row.shortcut).toLowerCase(),row])); const bodies = new Set((existing.data || []).map((row:any)=>String(row.body||'').trim().toLowerCase()))
  const analysis = rows.map((raw:any,index:number)=>{const n=normalized(raw);const messages:string[]=[];let disposition:'valid'|'warning'|'rejected'='valid';if(!n.title||!n.body){messages.push('TITLE_BODY_REQUIRED');disposition='rejected'} if(n.body.length>12000){messages.push('BODY_TOO_LONG');disposition='rejected'} if(n.shortcut&&byShortcut.has(n.shortcut.toLowerCase())){messages.push('DUPLICATE_SHORTCUT');disposition=disposition==='rejected'?'rejected':'warning'} if(byTitle.has(n.title.toLowerCase())){messages.push('DUPLICATE_TITLE');disposition=disposition==='rejected'?'rejected':'warning'} if(bodies.has(n.body.toLowerCase())){messages.push('EXACT_DUPLICATE_BODY');disposition=disposition==='rejected'?'rejected':'warning'} const invalidVars=[...n.body.matchAll(/\{\{([^}]+)\}\}/g)].map(m=>m[1]).filter(v=>!['contact_name','organization','city','service','owner','first_name','operator_name'].includes(v));if(invalidVars.length){messages.push(`UNKNOWN_VARIABLES:${invalidVars.join(',')}`);disposition=disposition==='rejected'?'rejected':'warning'} return {row_number:index+1,raw_row:raw,normalized_row:n,disposition,messages}})
  const summary={total:analysis.length,valid:analysis.filter((row:any)=>row.disposition==='valid').length,warnings:analysis.filter((row:any)=>row.disposition==='warning').length,rejected:analysis.filter((row:any)=>row.disposition==='rejected').length}
  if (!commit) return ok({ mode:'preview', category:category.data, summary, rows:analysis })
  if (summary.rejected) return fail('IMPORT_HAS_REJECTED_ROWS', 409, { summary, rows: analysis.filter((row:any)=>row.disposition==='rejected').slice(0,100) })
  const job = await context.supabase.from('ac_whatsapp_import_jobs').insert({ import_type:'saved_responses', category_id:categoryId, file_name:b.file_name||null, source_sha256:b.source_sha256||null, status:'validated', total_rows:summary.total, valid_rows:summary.valid, warning_rows:summary.warnings, rejected_rows:summary.rejected, created_by:context.user.id, metadata:{category_name:category.data.name} }).select('*').single(); if(job.error)return fail(job.error.message,500)
  let created=0,updated=0
  for(const item of analysis){const n=item.normalized_row; const match:any=byTitle.get(n.title.toLowerCase()); let entity:any; let entityAction='created'; let previousState:any=null
    if(match){previousState=match;entityAction='updated';const upd=await context.supabase.from('ac_whatsapp_templates').update({category_id:categoryId,category:category.data.code,body:n.body,shortcut:n.shortcut,language:n.language,tags:n.tags,description:n.description,service_line:n.service_line,status:n.status==='active'?'draft':n.status,approval_status:'draft',updated_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',match.id).select('*').single();if(upd.error)return fail(upd.error.message,500);entity=upd.data;updated++}
    else {const ins=await context.supabase.from('ac_whatsapp_templates').insert({code:`${category.data.code}-${code(n.title,item.row_number)}-${crypto.randomUUID().slice(0,6)}`,name:n.title,category:category.data.code,category_id:categoryId,body:n.body,shortcut:n.shortcut,language:n.language,tags:n.tags,description:n.description,service_line:n.service_line,status:n.status==='active'?'draft':n.status,approval_status:'draft',scope:'organization',created_by:context.user.id,updated_by:context.user.id}).select('*').single();if(ins.error)return fail(ins.error.message,500);entity=ins.data;created++}
    await context.supabase.from('ac_whatsapp_import_rows').insert({import_job_id:job.data.id,row_number:item.row_number,raw_row:item.raw_row,normalized_row:n,disposition:'committed',messages:item.messages,entity_type:'template',entity_id:entity.id,entity_action:entityAction,previous_state:previousState})
  }
  const done=await context.supabase.from('ac_whatsapp_import_jobs').update({status:'committed',created_count:created,updated_count:updated,committed_by:context.user.id,committed_at:new Date().toISOString()}).eq('id',job.data.id).select('*').single(); if(done.error)return fail(done.error.message,500)
  await audit(context,{action:'responses.import.commit',entityType:'import_job',entityId:job.data.id,newState:{summary,created,updated,category_id:categoryId}})
  return ok({job:done.data,summary,created,updated},{status:201})
}
