import { NextResponse } from "next/server";
import { emailOsAdminClient } from "@/lib/email-os/v8-core";
export async function GET(req:Request){
  try{ const {searchParams}=new URL(req.url); const q=searchParams.get("q")||""; const supabase=emailOsAdminClient(); let query=supabase.from("email_messages").select("*").order("created_at",{ascending:false}).limit(100); if(q) query=query.ilike("subject",`%${q}%`); const {data,error}=await query; if(error) throw error; return NextResponse.json({ok:true,messages:data||[]}); }catch(e:any){ return NextResponse.json({ok:false,error:e.message},{status:500}) }
}
