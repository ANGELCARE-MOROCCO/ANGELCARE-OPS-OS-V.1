import { NextResponse } from "next/server";
import { emailOsAdminClient } from "@/lib/email-os/v8-core";
export async function GET(){
  try{
    const supabase=emailOsAdminClient();
    const {data:mailboxes}=await supabase.from("email_accounts").select("id,label,email_address,department,health_status,sync_status,queue_size,failure_rate,last_sync_at").limit(13);
    const {data:messages}=await supabase.from("email_messages").select("id,mailbox_id,subject,from_email,to_email,status,priority,category,received_at,has_attachments,thread_id,assigned_to,snippet").order("created_at",{ascending:false}).limit(20);
    return NextResponse.json({ok:true, mailboxes:mailboxes||[], messages:messages||[], at:new Date().toISOString()});
  }catch(e:any){ return NextResponse.json({ok:false,error:e.message},{status:500}) }
}
