import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
import { parseCsv } from '@/lib/ac-whatsapp/revenue-intelligence/csv'

export const runtime='nodejs'

export async function POST(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage');if('error' in context)return context.error
  const form=await request.formData().catch(()=>null);if(!form)return fail('MULTIPART_REQUIRED',415)
  const file=form.get('file');if(!(file instanceof File))return fail('CSV_FILE_REQUIRED',422)
  const text=await file.text();if(text.length>8_000_000)return fail('CSV_TOO_LARGE',413)
  const parsed=parseCsv(text);if(!parsed.headers.length)return fail('CSV_EMPTY',422,parsed.errors)
  const required=['code','entity_type','title','content'];const missing=required.filter(key=>!parsed.headers.includes(key));if(missing.length)return fail('KNOWLEDGE_COLUMNS_REQUIRED',422,{missing})
  const normalized=parsed.rows.map((row,index)=>{
    const errors:string[]=[];if(!row.code)errors.push('CODE_REQUIRED');if(!row.entity_type)errors.push('ENTITY_TYPE_REQUIRED');if(!row.title)errors.push('TITLE_REQUIRED');if(!row.content)errors.push('CONTENT_REQUIRED')
    const scope={customer_types:[row.customer_type||'all'],service_lines:[row.service_line||'all'],intent_families:[row.intent_family||'all']}
    return {index,row,errors,payload:{code:row.code||`KNOWLEDGE_${index+1}`,entity_type:row.entity_type||'knowledge',title:row.title||row.code||`Knowledge ${index+1}`,content:{rule:row.content||''},scope,truth_status:'validated',source_kind:'csv',priority:Math.max(0,Math.min(100,Number(row.priority||50))),active:true,updated_by:context.user.id}}
  })
  const applicable=normalized.filter(x=>!x.errors.length);const blocked=normalized.filter(x=>x.errors.length)
  if(applicable.length){const result=await context.supabase.from('ac_whatsapp_cc_knowledge_entities').upsert(applicable.map(x=>x.payload),{onConflict:'code'});if(result.error)return fail(result.error.message,500)}
  const green=blocked.length===0&&applicable.length>0
  await audit(context,{action:'commercial-cognition.knowledge.csv_import',entityType:'cc_knowledge_batch',reason:file.name,newState:{rows:normalized.length,applicable:applicable.length,blocked:blocked.length,green}})
  return ok({green,status:green?'validated':'review_required',stats:{rows:normalized.length,applicable:applicable.length,blocked:blocked.length},blocked:blocked.map(x=>({row:x.index+2,errors:x.errors}))},{status:201})
}
