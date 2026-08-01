import { NextRequest } from 'next/server'
import { acContext, audit, fail, normalizePhone, ok, phoneToChatId } from '@/lib/ac-whatsapp/server'

export async function GET(request:NextRequest){const context=await acContext(request,'ac-whatsapp.view');if('error'in context)return context.error;const q=new URL(request.url).searchParams.get('q')?.toLowerCase();const result=await context.supabase.from('ac_whatsapp_contacts').select('*').order('last_contact_at',{ascending:false,nullsFirst:false}).limit(1000);if(result.error)return fail(result.error.message,500);let rows=result.data||[];if(q)rows=rows.filter((x:any)=>[x.display_name,x.organization_name,x.phone_number_e164,x.city,x.tags?.join(' ')].some(v=>String(v||'').toLowerCase().includes(q)));return ok(rows)}

export async function POST(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.contact.manage');if('error'in context)return context.error;const body=await request.json().catch(()=>({}));const inputs=Array.isArray(body.contacts)?body.contacts:[body]
 if(!inputs.length)return fail('CONTACT_REQUIRED',422)
 const rows=inputs.map((x:any)=>{const phone=normalizePhone(x.phone_number_e164||x.phone||x.whatsapp_id);return{whatsapp_id:x.whatsapp_id||phoneToChatId(phone),phone_number_e164:phone,display_name:x.display_name||x.name||phone,organization_name:x.organization_name||x.organization||null,contact_type:x.contact_type||'prospect',preferred_language:x.preferred_language||'fr',city:x.city||null,lead_stage:x.lead_stage||'new',priority:x.priority||'normal',tags:Array.isArray(x.tags)?x.tags:[],custom_fields:x.custom_fields||{},created_by:context.user.id,updated_by:context.user.id}})
 const result=await context.supabase.from('ac_whatsapp_contacts').upsert(rows,{onConflict:'whatsapp_id'}).select('*');if(result.error)return fail(result.error.message,500);await audit(context,{action:'contacts.import',entityType:'contact',newState:{count:result.data?.length||0}});return ok(result.data||[],{status:201})
}
