import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
function ok(data: unknown) { return NextResponse.json({ ok: true, data }); }
function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ ok: false, error: message }, { status });
}

import { db } from '@/lib/email-os/supabase';
export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const accountId = req.nextUrl.searchParams.get('account_id');
    const direction = req.nextUrl.searchParams.get('direction');
    let query = supabase.from('email_messages').select('*, email_accounts(*)').order('created_at', { ascending: false }).limit(250);
    if (accountId) query = query.eq('account_id', accountId);
    if (direction) query = query.eq('direction', direction);
    const { data, error } = await query;
    if (error) throw error;
    return ok(data || []);
  } catch (e) { return fail(e); }
}
