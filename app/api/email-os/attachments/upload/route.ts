import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditEmailAction } from '@/lib/email-os/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const draftId = String(form.get('draft_id') || '') || null;
    const messageId = String(form.get('message_id') || '') || null;
    if (!file) return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 });
    const supabase = await createClient();
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${Date.now()}-${safeName}`;
    const bucket = 'email-attachments';
    const upload = await supabase.storage.from(bucket).upload(storagePath, bytes, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (upload.error) throw upload.error;
    const { data, error } = await supabase.from('email_attachments').insert({
      draft_id: draftId,
      message_id: messageId,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_bucket: bucket,
      storage_path: storagePath,
    }).select('*').single();
    if (error) throw error;
    await auditEmailAction('attachment_uploaded', {
      entity_type: 'email_attachment',
      entity_id: data?.id || '',
      file_name: file.name,
      size_bytes: file.size,
    });
    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || String(error) }, { status: 500 });
  }
}
