import { NextResponse } from "next/server";
import { emailOsAdminClient } from "@/lib/email-os/v8-core";
export async function POST(req:Request){
  try{
    const body=await req.json().catch(()=>({}));
    const max=Number(body.max_per_minute||20);
    const supabase=emailOsAdminClient();
    await supabase.from("email_engine_settings").upsert({ key:"queue_throttle", value:{ max_per_minute:max, enabled:true, updated_at:new Date().toISOString() } }, { onConflict:"key" });
    await supabase.from("email_audit_logs").insert({ action:"queue_throttle_updated", entity_type:"email_engine", details:{ max_per_minute:max }}).catch?.(()=>{});
    return NextResponse.json({ok:true,max_per_minute:max});
  }catch(e:any){ return NextResponse.json({ok:false,error:e.message},{status:500}) }
}
