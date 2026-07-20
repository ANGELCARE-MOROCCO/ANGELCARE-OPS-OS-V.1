import { NextRequest, NextResponse } from "next/server"
import { fail } from "@/lib/whatsapp-desktop/server"
import { CONTEXT_PERMISSIONS, contextEvent, contextRequestContext, loadBusinessContext } from "@/lib/whatsapp-desktop/context-server"
async function idOf(ctx:{params:Promise<{id:string}>|{id:string}}){return String((await Promise.resolve(ctx.params)).id||"")}
export async function GET(request:NextRequest,routeContext:{params:Promise<{id:string}>|{id:string}}){
  const context=await contextRequestContext(request,CONTEXT_PERMISSIONS.view); if("error" in context)return context.error
  const id=await idOf(routeContext)
  const {data:document,error}=await context.supabase.from("whatsapp_context_documents").select("*").eq("id",id).maybeSingle()
  if(error)return fail(error.message,500); if(!document)return fail("CONTEXT_DOCUMENT_NOT_FOUND",404)
  try{
    await loadBusinessContext(context.supabase,document.context_id,context.userId,false,CONTEXT_PERMISSIONS.view)
    const target=new URL(String(document.secure_url||""))
    if(target.protocol!=="https:"&&target.origin!==request.nextUrl.origin)return fail("DOCUMENT_URL_NOT_ALLOWED",422)
    if(document.expires_at&&new Date(document.expires_at).getTime()<=Date.now())return fail("DOCUMENT_LINK_EXPIRED",410)
    await contextEvent(context.supabase,{contextId:document.context_id,workspaceId:document.workspace_id,userId:context.userId,eventType:"context_document_opened",title:"Document contextuel ouvert",detail:document.label,entityType:"document",entityId:document.id})
    return NextResponse.redirect(target,302)
  }catch(cause){return fail(cause instanceof Error?cause.message:String(cause),403)}
}
