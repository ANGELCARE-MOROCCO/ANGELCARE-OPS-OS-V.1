import { NextResponse } from "next/server";
import { emailOsAdminClient } from "@/lib/email-os/v8-core";
export async function GET(){
  try{ const supabase=emailOsAdminClient(); const {data,error}=await supabase.from("email_threads").select("*").order("last_activity_at",{ascending:false}).limit(100); if(error) throw error; return NextResponse.json({ok:true,threads:data||[]}); }catch(e:any){ return NextResponse.json({ok:false,error:e.message},{status:500}) }
}
