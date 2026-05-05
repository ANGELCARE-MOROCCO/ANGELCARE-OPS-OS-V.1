import { NextResponse } from "next/server";
import { emailOsAdminClient } from "@/lib/email-os/v8-core";
export async function GET(){
  try{ const supabase=emailOsAdminClient(); const {data,error}=await supabase.from("email_attachments").select("*").order("created_at",{ascending:false}).limit(100); if(error) throw error; return NextResponse.json({ok:true,attachments:data||[]}); }catch(e:any){ return NextResponse.json({ok:false,error:e.message},{status:500}) }
}
export async function POST(req:Request){
  try{ const body=await req.json(); const supabase=emailOsAdminClient(); const {data,error}=await supabase.from("email_attachments").insert(body).select("*").single(); if(error) throw error; return NextResponse.json({ok:true,attachment:data}); }catch(e:any){ return NextResponse.json({ok:false,error:e.message},{status:500}) }
}
