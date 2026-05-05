import { NextResponse } from 'next/server';
import { adminClient } from '../_supabase';

async function countSafe(supabase: ReturnType<typeof adminClient>, table: string, filter?: (q: any) => any) {
  try {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const supabase = adminClient();
    const mailboxes = await countSafe(supabase, 'email_accounts');
    const queued = await countSafe(supabase, 'email_outbox_queue', (q) => q.in('status', ['queued', 'pending', 'retrying']));
    const failed = await countSafe(supabase, 'email_outbox_queue', (q) => q.eq('status', 'failed'));
    const approvals = await countSafe(supabase, 'email_approvals', (q) => q.in('status', ['pending', 'requested']));
    const threads = await countSafe(supabase, 'email_threads');

    const events = [
      `01 V11 pulse online: ${new Date().toISOString()}`,
      `02 Mailboxes detected: ${mailboxes}`,
      `03 Queue pending/retry workload: ${queued}`,
      `04 Failed sends requiring attention: ${failed}`,
      `05 Approvals waiting: ${approvals}`,
      `06 Threads indexed: ${threads}`,
      '07 Human-controlled command layer active',
    ];

    return NextResponse.json({ mailboxes, queued, failed, approvals, threads, health: failed > 0 ? 'attention' : 'stable', events });
  } catch (error: any) {
    return NextResponse.json({ mailboxes: 0, queued: 0, failed: 0, approvals: 0, threads: 0, health: 'offline', events: [`Pulse error: ${error.message}`] }, { status: 200 });
  }
}
