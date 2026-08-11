import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
import { deleteMediaVaultObject, verifyMediaVaultObject } from '@/lib/ac-whatsapp/media-vault'

const IN_FLIGHT = new Set(['draft','scheduled','queued','processing','accepted'])
const CONFIRMATION = 'PURGER MEDIA WHATSAPP'

type Scope = { account_id?: string | null; conversation_id?: string | null; direction?: string | null; media_type?: string | null; older_than_days?: number | null; attachment_ids?: string[]; all?: boolean }

function buildScope(body: any): Scope {
  const scope = body?.scope && typeof body.scope === 'object' ? body.scope : body || {}
  return {
    account_id: scope.account_id || null,
    conversation_id: scope.conversation_id || null,
    direction: ['inbound','outbound'].includes(String(scope.direction)) ? String(scope.direction) : null,
    media_type: String(scope.media_type || '').trim() || null,
    older_than_days: Number.isFinite(Number(scope.older_than_days)) && Number(scope.older_than_days) > 0 ? Number(scope.older_than_days) : null,
    attachment_ids: Array.isArray(scope.attachment_ids) ? scope.attachment_ids.map(String).slice(0,5000) : undefined,
    all: scope.all === true,
  }
}

async function inventory(context: any, scope: Scope = {}) {
  let query: any = context.supabase.from('ac_whatsapp_attachments').select('*,message:ac_whatsapp_messages(id,status,direction,created_at,conversation_id,account_id,client_message_id)').is('purged_at', null).not('storage_path','is',null).order('created_at',{ascending:false}).limit(10000)
  if (scope.attachment_ids?.length) query = query.in('id', scope.attachment_ids)
  if (scope.media_type) query = query.ilike('mime_type', scope.media_type.includes('/') ? scope.media_type : `${scope.media_type}/%`)
  if (scope.older_than_days) query = query.lt('created_at', new Date(Date.now() - scope.older_than_days * 86400000).toISOString())
  const result = await query
  if (result.error) throw result.error
  const rows = (result.data || []).filter((row:any) => {
    if (!(row.storage_provider === 'windows' || row.storage_provider === 'windows_pending')) return false
    const message = row.message || {}
    if (!context.access.global && !context.access.accountIds.includes(String(message.account_id || ''))) return false
    if (scope.conversation_id && String(message.conversation_id || '') !== String(scope.conversation_id)) return false
    if (scope.account_id && String(message.account_id || '') !== String(scope.account_id)) return false
    if (scope.direction && String(message.direction || '') !== scope.direction) return false
    return true
  })
  const clientIds = rows.map((row:any)=>row.message?.client_message_id).filter(Boolean)
  let outboxRows:any[]=[]
  if (clientIds.length) {
    const outbox=await context.supabase.from('ac_whatsapp_outbox').select('client_message_id,status,last_error,available_at').in('client_message_id',clientIds.slice(0,5000))
    if(outbox.error)throw outbox.error
    outboxRows=outbox.data||[]
  }
  const outboxByClient=new Map(outboxRows.map((row:any)=>[row.client_message_id,row]))
  return rows.map((row:any)=>{
    const outbox=outboxByClient.get(row.message?.client_message_id)
    const protectedReason = IN_FLIGHT.has(String(row.message?.status||'')) || (outbox && ['scheduled','queued','processing'].includes(String(outbox.status)))
      ? `TRANSPORT_${String(outbox?.status || row.message?.status || 'IN_FLIGHT').toUpperCase()}` : null
    return {...row,outbox,protected_reason:protectedReason}
  })
}

function summarize(rows:any[]){
  const candidates=rows.filter(row=>!row.protected_reason)
  const protectedRows=rows.filter(row=>row.protected_reason)
  const bytes=(list:any[])=>list.reduce((sum,row)=>sum+Number(row.size_bytes||0),0)
  const groups=rows.reduce((acc:any,row:any)=>{const mime=String(row.mime_type||'application/octet-stream');const key=mime.startsWith('image/')?'images':mime.startsWith('video/')?'videos':mime.startsWith('audio/')?'audio':mime==='application/pdf'?'pdf':'documents';acc[key]=(acc[key]||0)+1;return acc},{})
  return {total_items:rows.length,total_bytes:bytes(rows),candidate_items:candidates.length,candidate_bytes:bytes(candidates),protected_items:protectedRows.length,protected_bytes:bytes(protectedRows),groups}
}

export async function GET(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.storage.view');if('error'in context)return context.error
  try{
    const scope=buildScope(Object.fromEntries(request.nextUrl.searchParams.entries()))
    const rows=await inventory(context,scope)
    const policies=await context.supabase.from('ac_whatsapp_media_retention_policies').select('*').order('created_at',{ascending:false}).limit(100)
    const jobs=await context.supabase.from('ac_whatsapp_media_purge_jobs').select('*').order('created_at',{ascending:false}).limit(50)
    if(policies.error)return fail(policies.error.message,500);if(jobs.error)return fail(jobs.error.message,500)
    return ok({summary:summarize(rows),items:rows.slice(0,250),policies:policies.data||[],jobs:jobs.data||[],capabilities:{physical_orphan_enumeration:false,reason:'Media Vault expose verify/delete par storageKey, pas de listing filesystem public. Aucun faux compteur orphelin n’est présenté.'}})
  }catch(cause){return fail(cause instanceof Error?cause.message:'MEDIA_VAULT_INVENTORY_FAILED',500)}
}

export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>({}));const action=String(body.action||'preview')
  const required=action==='preview'||action==='verify'?'ac-whatsapp.storage.view':action==='save_policy'?'ac-whatsapp.storage.manage':'ac-whatsapp.storage.purge'
  const context=await acContext(request,required as any);if('error'in context)return context.error
  try{
    if(action==='preview'){
      const scope=buildScope(body);const rows=await inventory(context,scope);return ok({scope,summary:summarize(rows),protected:rows.filter((r:any)=>r.protected_reason).slice(0,100),candidates:rows.filter((r:any)=>!r.protected_reason).slice(0,100),confirmation_phrase:CONFIRMATION})
    }
    if(action==='verify'){
      const ids=Array.isArray(body.attachment_ids)?body.attachment_ids.map(String).slice(0,100):[];if(!ids.length)return fail('ATTACHMENT_IDS_REQUIRED',422)
      const rows=await inventory(context,{attachment_ids:ids});const results=[]
      for(const row of rows){try{const receipt=await verifyMediaVaultObject(String(row.storage_path),row.checksum||null);results.push({id:row.id,ok:true,receipt});await context.supabase.from('ac_whatsapp_attachments').update({verified_at:new Date().toISOString(),migration_status:'ready'}).eq('id',row.id)}catch(cause){results.push({id:row.id,ok:false,error:cause instanceof Error?cause.message:String(cause)});await context.supabase.from('ac_whatsapp_attachments').update({migration_status:'missing'}).eq('id',row.id)}}
      await audit(context,{action:'storage.verify',entityType:'attachment_batch',newState:{count:results.length,failed:results.filter(r=>!r.ok).length}});return ok(results)
    }
    if(action==='save_policy'){
      const policy={name:String(body.name||'Politique de rétention').trim(),account_id:body.account_id||null,direction:['inbound','outbound','all'].includes(String(body.direction))?body.direction:'all',media_types:Array.isArray(body.media_types)?body.media_types.map(String):[],retention_days:Math.max(1,Math.min(3650,Number(body.retention_days||90))),status:['draft','active','paused','archived'].includes(String(body.status))?body.status:'draft',preserve_message_history:true,updated_by:context.user.id}
      let result:any
      if(body.id)result=await context.supabase.from('ac_whatsapp_media_retention_policies').update({...policy,updated_at:new Date().toISOString()}).eq('id',body.id).select('*').single()
      else result=await context.supabase.from('ac_whatsapp_media_retention_policies').insert({...policy,created_by:context.user.id}).select('*').single()
      if(result.error)return fail(result.error.message,500);await audit(context,{action:'storage.retention.save',entityType:'media_retention_policy',entityId:result.data.id,newState:result.data});return ok(result.data,{status:body.id?200:201})
    }
    if(action==='create_job'){
      if(String(body.confirmation||'')!==CONFIRMATION)return fail('PURGE_CONFIRMATION_REQUIRED',422);const reason=String(body.reason||'').trim();if(!reason)return fail('PURGE_REASON_REQUIRED',422)
      const scope=buildScope(body);const rows=await inventory(context,scope);const summary=summarize(rows)
      const job=await context.supabase.from('ac_whatsapp_media_purge_jobs').insert({scope,status:'running',total_items:summary.total_items,total_bytes:summary.total_bytes,protected_items:summary.protected_items,confirmation_phrase:CONFIRMATION,reason,created_by:context.user.id,executed_by:context.user.id,started_at:new Date().toISOString()}).select('*').single();if(job.error)return fail(job.error.message,500)
      if(rows.length){const items=rows.map((row:any)=>({purge_job_id:job.data.id,attachment_id:row.id,message_id:row.message?.id||null,storage_path:row.storage_path,file_name:row.file_name,mime_type:row.mime_type,size_bytes:row.size_bytes,disposition:row.protected_reason?'protected':'candidate',error_message:row.protected_reason||null}));for(let i=0;i<items.length;i+=500){const ins=await context.supabase.from('ac_whatsapp_media_purge_items').insert(items.slice(i,i+500));if(ins.error)return fail(ins.error.message,500)}}
      await audit(context,{action:'storage.purge.create',entityType:'media_purge_job',entityId:job.data.id,newState:{scope,summary},reason});return ok({job:job.data,summary},{status:201})
    }
    if(action==='run_job'){
      const jobId=String(body.job_id||'');if(!jobId)return fail('JOB_ID_REQUIRED',422)
      const job=await context.supabase.from('ac_whatsapp_media_purge_jobs').select('*').eq('id',jobId).maybeSingle();if(job.error)return fail(job.error.message,500);if(!job.data)return fail('PURGE_JOB_NOT_FOUND',404);if(!['running','partial'].includes(job.data.status))return ok({job:job.data,processed:0})
      const batch=await context.supabase.from('ac_whatsapp_media_purge_items').select('*').eq('purge_job_id',jobId).eq('disposition','candidate').order('created_at').limit(25);if(batch.error)return fail(batch.error.message,500)
      for(const item of batch.data||[]){try{await deleteMediaVaultObject(String(item.storage_path));const now=new Date().toISOString();await context.supabase.from('ac_whatsapp_attachments').update({previous_storage_path:item.storage_path,storage_path:null,purged_at:now,purged_by:context.user.id,purge_reason:job.data.reason,purge_job_id:jobId,purge_verified_at:now,migration_status:'purged'}).eq('id',item.attachment_id);await context.supabase.from('ac_whatsapp_media_purge_items').update({disposition:'deleted',verified_at:now}).eq('id',item.id)}catch(cause){const error=cause instanceof Error?cause.message:String(cause);const missing=/not.?found|404|missing/i.test(error);if(missing){const now=new Date().toISOString();await context.supabase.from('ac_whatsapp_attachments').update({previous_storage_path:item.storage_path,storage_path:null,purged_at:now,purged_by:context.user.id,purge_reason:`Objet déjà absent · ${job.data.reason}`,purge_job_id:jobId,purge_verified_at:now,migration_status:'purged'}).eq('id',item.attachment_id);await context.supabase.from('ac_whatsapp_media_purge_items').update({disposition:'missing',error_message:error,verified_at:now}).eq('id',item.id)}else await context.supabase.from('ac_whatsapp_media_purge_items').update({disposition:'failed',error_message:error}).eq('id',item.id)}}
      const aggregate=await context.supabase.from('ac_whatsapp_media_purge_items').select('disposition,size_bytes').eq('purge_job_id',jobId);if(aggregate.error)return fail(aggregate.error.message,500);const rows=aggregate.data||[];const remaining=rows.filter((row:any)=>row.disposition==='candidate').length;const deleted=rows.filter((row:any)=>['deleted','missing'].includes(row.disposition));const failed=rows.filter((row:any)=>row.disposition==='failed');const status=remaining?'running':failed.length?'partial':'completed';const patch={status,deleted_items:deleted.length,deleted_bytes:deleted.reduce((sum:number,row:any)=>sum+Number(row.size_bytes||0),0),failed_items:failed.length,completed_at:remaining?null:new Date().toISOString()};const updated=await context.supabase.from('ac_whatsapp_media_purge_jobs').update(patch).eq('id',jobId).select('*').single();if(updated.error)return fail(updated.error.message,500);if(!remaining)await audit(context,{action:'storage.purge.complete',entityType:'media_purge_job',entityId:jobId,newState:patch,reason:job.data.reason});return ok({job:updated.data,processed:(batch.data||[]).length,remaining})
    }
    return fail('UNSUPPORTED_MEDIA_VAULT_ACTION',422)
  }catch(cause){return fail(cause instanceof Error?cause.message:'MEDIA_VAULT_ACTION_FAILED',500)}
}
