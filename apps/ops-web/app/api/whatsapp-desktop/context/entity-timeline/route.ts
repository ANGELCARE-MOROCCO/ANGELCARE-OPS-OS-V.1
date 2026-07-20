import { NextRequest } from "next/server"
import { fail,ok } from "@/lib/whatsapp-desktop/server"
import { CONTEXT_PERMISSIONS,contextRequestContext,ensureSourceModulePermission } from "@/lib/whatsapp-desktop/context-server"
export async function GET(request:NextRequest){
  const context=await contextRequestContext(request,CONTEXT_PERMISSIONS.view); if("error" in context)return context.error
  const contextType=String(request.nextUrl.searchParams.get("context_type")||""); const entityId=String(request.nextUrl.searchParams.get("entity_id")||"")
  if(!contextType||!entityId)return fail("CONTEXT_TYPE_AND_ENTITY_ID_REQUIRED")
  try{ensureSourceModulePermission(context.user,contextType)}catch(error){return fail(error instanceof Error?error.message:String(error),403)}
  const {data:sessions,error}=await context.supabase.from("whatsapp_context_sessions").select("id,workspace_id,user_id,context_type,entity_id,entity_name,communication_purpose,status,created_at,updated_at").eq("context_type",contextType).eq("entity_id",entityId).order("created_at",{ascending:false}).limit(50)
  if(error)return fail(error.message,500); const ids=(sessions||[]).map((row:any)=>row.id); if(!ids.length)return ok({sessions:[],events:[]})
  const {data:events,error:eventError}=await context.supabase.from("whatsapp_context_events").select("*").in("context_id",ids).order("created_at",{ascending:false}).limit(300)
  if(eventError)return fail(eventError.message,500); return ok({sessions:sessions||[],events:events||[]})
}
