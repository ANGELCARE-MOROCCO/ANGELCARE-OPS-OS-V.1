import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function db() {
  return await createClient();
}

function ok(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ ok: false, error: message }, { status });
}

import { listAccounts, upsertAccountMetadata, upsertAccountPassword } from '@/lib/email-os/accounts';
import { auditEmailAction } from '@/lib/email-os/audit';
export async function GET() { try { return ok(await listAccounts()); } catch (e) { return fail(e); } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.email && !body.email_address) return fail('email is required', 400);
    let account = await upsertAccountMetadata(body);
    if (body.password) account = await upsertAccountPassword(body.email || body.email_address, body.password);
await auditEmailAction(
  JSON.stringify({
    action: 'attachment_uploaded',
    entity_type: 'email_attachment',
    entity_id: '',
  })
)
    return ok(account);
  } catch (e) { return fail(e); }
}
