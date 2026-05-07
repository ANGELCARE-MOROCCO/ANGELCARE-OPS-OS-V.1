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
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (process.env.EMAIL_OS_CRON_SECRET && token !== process.env.EMAIL_OS_CRON_SECRET) return fail('Invalid cron token', 401);
    return ok(await processOutbox(Number(req.nextUrl.searchParams.get('limit') || 10)));
  } catch (e) { return fail(e); }
}
