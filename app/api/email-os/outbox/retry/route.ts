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

import { processOutbox } from '@/lib/email-os/outbox';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return ok(await processOutbox(Number(body.limit || 10)));
  } catch (e) { return fail(e); }
}
