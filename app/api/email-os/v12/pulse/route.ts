import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function GET() {
  try {
    const supabase = createEmailOSV12Supabase();
    const [{ count: logs }, { count: views }, { count: notes }] = await Promise.all([
      supabase.from('email_engine_logs_v12').select('*', { count: 'exact', head: true }),
      supabase.from('email_saved_views').select('*', { count: 'exact', head: true }),
      supabase.from('email_internal_notes').select('*', { count: 'exact', head: true }),
    ]);
    return NextResponse.json({ ok: true, pulse: { logs: logs || 0, saved_views: views || 0, internal_notes: notes || 0, status: 'online', ts: new Date().toISOString() } });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
