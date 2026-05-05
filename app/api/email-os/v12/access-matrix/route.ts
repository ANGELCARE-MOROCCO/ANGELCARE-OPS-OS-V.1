import { NextResponse } from 'next/server';
import { createEmailOSV12Supabase } from '@/lib/email-os/v12/supabaseServer';

export async function GET() {
  try {
    const supabase = createEmailOSV12Supabase();
    const { data, error } = await supabase.from('user_email_permissions').select('*').limit(500);
    if (error) throw error;
    return NextResponse.json({ ok: true, permissions: data || [] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createEmailOSV12Supabase();
    const { error: auditError } = await supabase.from('email_access_audit_v12').insert({
      actor_user_id: body.actor_user_id || null,
      target_user_id: body.user_id || null,
      mailbox_id: body.mailbox_id || null,
      action: body.action || 'permission_update',
      after_state: body.permission || {},
      reason: body.reason || null
    });
    if (auditError) throw auditError;
    return NextResponse.json({ ok: true, message: 'Access audit recorded. Apply permission update through your existing user_email_permissions flow if required.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
