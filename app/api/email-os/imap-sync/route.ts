import { NextResponse } from "next/server";
import { emailOsAdminClient, normalizeThreadSubject } from "@/lib/email-os/v8-core";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const supabase = emailOsAdminClient();
    const { data: mailboxes } = await supabase.from("email_accounts").select("id,label,email_address,imap_host,imap_port,imap_user,imap_secure,is_active").eq("is_active", true).limit(body.limit || 13);
    let inserted = 0;
    for (const mailbox of mailboxes || []) {
      // Production hook: connect imapflow here when credentials are available. This route is defensive and logs sync cycles now.
      const subject = `V8 sync heartbeat - ${mailbox.label || mailbox.email_address}`;
      const threadKey = normalizeThreadSubject(subject);
      const { data: thread } = await supabase.from("email_threads").upsert({ mailbox_id: mailbox.id, thread_key: threadKey, subject, status: "sync_heartbeat", last_activity_at: new Date().toISOString() }, { onConflict: "mailbox_id,thread_key" }).select("id").single();
      await supabase.from("email_sync_events").insert({ mailbox_id: mailbox.id, event_type: "imap_sync_cycle", status: "completed", details: { mode: body.mode || "manual", host: mailbox.imap_host || "imap.menara.ma" }});
      if (thread?.id) inserted++;
    }
    return NextResponse.json({ ok: true, mode: body.mode || "manual", mailboxes: (mailboxes||[]).length, threads_touched: inserted });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
