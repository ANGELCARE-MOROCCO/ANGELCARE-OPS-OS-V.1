import { NextResponse } from "next/server";
import { emailOsAdminClient } from "@/lib/email-os/v8-core";
export async function GET(_req:Request,{params}:{params:{id:string}}){
  try{ const supabase=emailOsAdminClient(); const {data:thread}=await supabase.from("email_threads").select("*").eq("id",params.id).single(); const {data:messages}=await supabase.from("email_messages").select("*").eq("thread_id",params.id).order("created_at",{ascending:true}); const {data:attachments}=await supabase.from("email_attachments").select("*").eq("thread_id",params.id); return NextResponse.json({ok:true,thread,messages:messages||[],attachments:attachments||[]}); }catch(e:any){ return NextResponse.json({ok:false,error:e.message},{status:500}) }
}
