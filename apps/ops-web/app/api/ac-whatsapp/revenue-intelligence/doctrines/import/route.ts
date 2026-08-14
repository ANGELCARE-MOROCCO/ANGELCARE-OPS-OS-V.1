import { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
import { detectDoctrineConflicts, normalizeDoctrineRow, parseCsv } from '@/lib/ac-whatsapp/revenue-intelligence/csv'

export const runtime='nodejs'

export async function POST(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage')
  if('error' in context)return context.error
  const form=await request.formData().catch(()=>null)
  if(!form)return fail('MULTIPART_REQUIRED',415)
  const file=form.get('file')
  if(!(file instanceof File))return fail('CSV_FILE_REQUIRED',422)
  const text=await file.text(); if(text.length>8_000_000)return fail('CSV_TOO_LARGE',413)
  const parsed=parseCsv(text); if(!parsed.headers.length)return fail('CSV_EMPTY',422,parsed.errors)
  const packId=String(form.get('pack_id')||'')||null
  const packName=String(form.get('pack_name')||file.name.replace(/\.csv$/i,'')||'Imported Doctrine Pack')
  let pack:any=null
  if(packId){const found=await context.supabase.from('ac_whatsapp_ri_doctrine_packs').select('*').eq('id',packId).maybeSingle();if(found.error)return fail(found.error.message,500);pack=found.data}
  if(!pack){
    const code=`CSV_${createHash('sha1').update(`${file.name}:${Date.now()}`).digest('hex').slice(0,10).toUpperCase()}`
    const created=await context.supabase.from('ac_whatsapp_ri_doctrine_packs').insert({code,name:packName,status:'draft',maturity_level:'L0',version:1,source_kind:'csv',applicability_score:0,coverage_score:0,commercial_priority:60,default_goal:'advance_commercial_journey',created_by:context.user.id,updated_by:context.user.id}).select('*').single()
    if(created.error)return fail(created.error.message,500);pack=created.data
  }
  const normalized=parsed.rows.map(normalizeDoctrineRow)
  const conflicts=detectDoctrineConflicts(normalized)
  const sha256=createHash('sha256').update(text).digest('hex')
  const importRow=await context.supabase.from('ac_whatsapp_ri_imports').insert({file_name:file.name,sha256,status:'processing',pack_id:pack.id,headers:parsed.headers,stats:{rows:parsed.rows.length},uploaded_by:context.user.id}).select('*').single()
  if(importRow.error)return fail(importRow.error.message,500)
  const conflictIndexes=new Set(conflicts.flatMap(row=>[row.a,row.b]))
  const rowPayloads=normalized.map((row,index)=>({import_id:importRow.data.id,row_number:index+2,raw_row:parsed.rows[index],normalized_row:row.normalized,status:row.errors.length?'blocked':conflictIndexes.has(index)?'review':row.green?'applicable':'review',errors:row.errors,warnings:[...row.warnings,...(conflictIndexes.has(index)?['APPLICABILITY_CONFLICT']:[])],applicability_score:row.applicability}))
  if(rowPayloads.length){const stored=await context.supabase.from('ac_whatsapp_ri_import_rows').insert(rowPayloads);if(stored.error)return fail(stored.error.message,500)}
  const executable=normalized.map((row,index)=>({row,index})).filter(x=>!x.row.errors.length&&!conflictIndexes.has(x.index))
  if(executable.length){const nodes=executable.map(({row,index})=>({...row.normalized,pack_id:pack.id,source_import_id:importRow.data.id,source_row_number:index+2,created_by:context.user.id,updated_by:context.user.id}));const inserted=await context.supabase.from('ac_whatsapp_ri_doctrine_nodes').insert(nodes);if(inserted.error)return fail(inserted.error.message,500)}
  const applicable=normalized.filter((row,index)=>row.green&&!conflictIndexes.has(index)).length
  const blocked=normalized.filter(row=>row.errors.length).length
  const review=normalized.length-applicable-blocked
  const applicability=normalized.length?Math.round(normalized.reduce((sum,row)=>sum+row.applicability,0)/normalized.length):0
  const importStatus=blocked===0&&conflicts.length===0&&applicability>=75?'validated':'review_required'
  await Promise.all([
    context.supabase.from('ac_whatsapp_ri_imports').update({status:importStatus,stats:{rows:normalized.length,applicable,review,blocked,conflicts:conflicts.length,applicability},processed_at:new Date().toISOString()}).eq('id',importRow.data.id),
    context.supabase.from('ac_whatsapp_ri_doctrine_packs').update({status:importStatus==='validated'?'validated':'draft',applicability_score:applicability,coverage_score:Math.max(0,100-Math.round((blocked+conflicts.length)/Math.max(1,normalized.length)*100)),updated_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',pack.id),
  ])
  await audit(context,{action:'revenue.doctrine.csv_import',entityType:'ri_import',entityId:importRow.data.id,newState:{packId:pack.id,rows:normalized.length,applicable,review,blocked,conflicts:conflicts.length,applicability,status:importStatus}})
  return ok({importId:importRow.data.id,packId:pack.id,status:importStatus,green:importStatus==='validated',stats:{rows:normalized.length,applicable,review,blocked,conflicts:conflicts.length,applicability},conflicts},{status:201})
}
