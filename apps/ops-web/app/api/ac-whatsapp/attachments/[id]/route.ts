import { NextRequest } from 'next/server'
import { acContext, canAccessConversationRow, fail, ok } from '@/lib/ac-whatsapp/server'
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const context=await acContext(request,'ac-whatsapp.inbox.view');if('error'in context)return context.error;const {id}=await params
 const row=await context.supabase.from('ac_whatsapp_attachments').select('*,message:ac_whatsapp_messages(conversation_id,conversation:ac_whatsapp_conversations(*))').eq('id',id).maybeSingle();if(row.error)return fail(row.error.message,500);if(!row.data)return fail('ATTACHMENT_NOT_FOUND',404)
 const conversation=(row.data as any).message?.conversation;if(!canAccessConversationRow(context,conversation))return fail('ATTACHMENT_ACCESS_DENIED',403)
 if(row.data.source_url)return ok({url:row.data.source_url,fileName:row.data.file_name,mimeType:row.data.mime_type})
 if(!row.data.storage_path)return fail('ATTACHMENT_BINARY_UNAVAILABLE',404)
 const signed=await context.supabase.storage.from('ac-whatsapp-media').createSignedUrl(row.data.storage_path,300);if(signed.error)return fail(signed.error.message,500)
 return ok({url:signed.data.signedUrl,fileName:row.data.file_name,mimeType:row.data.mime_type,expiresIn:300})
}
