import { NextRequest } from 'next/server'
import { acContext, audit, fail, normalizePhone, ok, phoneToChatId } from '@/lib/ac-whatsapp/server'

export async function GET(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.view');if('error'in context)return context.error
 const q=request.nextUrl.searchParams.get('q')?.toLowerCase();const includeArchived=request.nextUrl.searchParams.get('include_archived')==='true';const id=String(request.nextUrl.searchParams.get('id')||'')
 let query:any=context.supabase.from('ac_whatsapp_contacts').select('*').order('last_contact_at',{ascending:false,nullsFirst:false}).limit(2000);if(!includeArchived)query=query.is('archived_at',null);if(id)query=query.eq('id',id)
 const result=await query;if(result.error)return fail(result.error.message,500);let rows=result.data||[];if(q)rows=rows.filter((x:any)=>[x.display_name,x.organization_name,x.phone_number_e164,x.city,x.contact_type,x.tags?.join(' ')].some(v=>String(v||'').toLowerCase().includes(q)))
 return ok(id?(rows[0]||null):rows)
}

export async function POST(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.contact.manage');if('error'in context)return context.error;const body=await request.json().catch(()=>({}))
 if(body.action==='merge'){
  const sourceId=String(body.source_id||'');const targetId=String(body.target_id||'');const reason=String(body.reason||'').trim();if(!sourceId||!targetId)return fail('SOURCE_TARGET_REQUIRED',422);if(!reason)return fail('MERGE_REASON_REQUIRED',422)
  const result=await context.supabase.rpc('ac_whatsapp_merge_contacts',{p_source_id:sourceId,p_target_id:targetId,p_reason:reason,p_actor_user_id:context.user.id,p_correlation_id:context.correlationId});if(result.error)return fail(result.error.message,500);return ok(result.data)
 }
 const inputs=Array.isArray(body.contacts)?body.contacts:[body];if(!inputs.length)return fail('CONTACT_REQUIRED',422)
 const rows=inputs.map((x:any)=>{const phone=normalizePhone(x.phone_number_e164||x.phone||x.whatsapp_id);const whatsappId=String(x.whatsapp_id||'').trim()||phoneToChatId(phone);if(!whatsappId)throw new Error('WHATSAPP_ID_OR_PHONE_REQUIRED');return{whatsapp_id:whatsappId,phone_number_e164:phone||null,display_name:x.display_name||x.name||phone||null,organization_name:x.organization_name||x.organization||null,contact_type:x.contact_type||'prospect',preferred_language:x.preferred_language||'fr',city:x.city||null,lead_stage:x.lead_stage||'new',priority:x.priority||'normal',tags:Array.isArray(x.tags)?x.tags:[],custom_fields:x.custom_fields||{},archived_at:null,archived_by:null,archive_reason:null,created_by:context.user.id,updated_by:context.user.id}})
 const result=await context.supabase.from('ac_whatsapp_contacts').upsert(rows,{onConflict:'whatsapp_id'}).select('*');if(result.error)return fail(result.error.message,500);await audit(context,{action:Array.isArray(body.contacts)?'contacts.import':'contact.create',entityType:'contact',newState:{count:result.data?.length||0}});return ok(result.data||[],{status:201})
}

export async function PATCH(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.contact.manage');if('error'in context)return context.error;const body=await request.json().catch(()=>({}));const id=String(body.id||'');if(!id)return fail('CONTACT_ID_REQUIRED',422)
 const current=await context.supabase.from('ac_whatsapp_contacts').select('*').eq('id',id).maybeSingle();if(current.error)return fail(current.error.message,500);if(!current.data)return fail('CONTACT_NOT_FOUND',404)
 if(body.action==='archive'){const reason=String(body.reason||'').trim();if(!reason)return fail('ARCHIVE_REASON_REQUIRED',422);const result=await context.supabase.from('ac_whatsapp_contacts').update({archived_at:new Date().toISOString(),archived_by:context.user.id,archive_reason:reason,updated_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500);await audit(context,{action:'contact.archive',entityType:'contact',entityId:id,previousState:current.data,newState:result.data,reason});return ok(result.data)}
 if(body.action==='restore'){const result=await context.supabase.from('ac_whatsapp_contacts').update({archived_at:null,archived_by:null,archive_reason:null,updated_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500);await audit(context,{action:'contact.restore',entityType:'contact',entityId:id,previousState:current.data,newState:result.data});return ok(result.data)}
 const patch:any={updated_by:context.user.id,updated_at:new Date().toISOString()};for(const key of ['display_name','first_name','last_name','organization_name','contact_type','preferred_language','city','country_code','owner_user_id','lead_stage','sentiment','priority','custom_fields'])if(key in body)patch[key]=body[key]=== ''?null:body[key];if('tags'in body)patch.tags=Array.isArray(body.tags)?body.tags.map(String):[]
 if('phone_number_e164'in body||'phone'in body){const phone=normalizePhone(body.phone_number_e164||body.phone);patch.phone_number_e164=phone||null;if(body.sync_whatsapp_id===true&&phone)patch.whatsapp_id=phoneToChatId(phone)}
 const result=await context.supabase.from('ac_whatsapp_contacts').update(patch).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500);await audit(context,{action:'contact.update',entityType:'contact',entityId:id,previousState:current.data,newState:result.data,reason:body.reason||null});return ok(result.data)
}

export async function DELETE(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.contact.manage');if('error'in context)return context.error;const body=await request.json().catch(()=>({}));const id=String(body.id||'');const reason=String(body.reason||'').trim();if(!id)return fail('CONTACT_ID_REQUIRED',422);if(!reason)return fail('ARCHIVE_REASON_REQUIRED',422)
 const current=await context.supabase.from('ac_whatsapp_contacts').select('*').eq('id',id).maybeSingle();if(current.error)return fail(current.error.message,500);if(!current.data)return fail('CONTACT_NOT_FOUND',404)
 const result=await context.supabase.from('ac_whatsapp_contacts').update({archived_at:new Date().toISOString(),archived_by:context.user.id,archive_reason:reason,updated_by:context.user.id,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(result.error)return fail(result.error.message,500);await audit(context,{action:'contact.archive',entityType:'contact',entityId:id,previousState:current.data,newState:result.data,reason});return ok(result.data)
}
