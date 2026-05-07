import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/email-os/supabase';
import { auditEmailAction } from '@/lib/email-os/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function ok(data: unknown) { return NextResponse.json({ ok: true, data }); }
function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.user_id) return fail('user_id is required', 400);
    if (!Array.isArray(body.permissions)) return fail('permissions array is required', 400);

    const supabase = await db();
    const rows = body.permissions.map((p: any) => ({
      user_id: body.user_id,
      account_id: p.account_id,
      can_read: Boolean(p.can_read),
      can_send: Boolean(p.can_send),
      can_approve: Boolean(p.can_approve),
      can_admin: Boolean(p.can_admin),
      temporary_until: p.temporary_until || null,
      restricted_reason: p.restricted_reason || null,
      assigned_by: body.assigned_by || null,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('user_mailbox_permissions')
      .upsert(rows, { onConflict: 'user_id,account_id' })
      .select('*');

    if (error) throw error;

    await auditEmailAction(JSON.stringify({
      action: 'user_manager_bulk_mailbox_permissions_saved',
      entity_type: 'user_mailbox_permissions',
      details: { user_id: body.user_id, count: rows.length },
    }));

    return ok(data);
  } catch (e) { return fail(e); }
}
