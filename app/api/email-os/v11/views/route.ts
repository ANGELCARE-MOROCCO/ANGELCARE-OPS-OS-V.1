import { NextResponse } from 'next/server';
import { adminClient } from '../_supabase';

export async function GET() {
  const supabase = adminClient();
  const { data, error } = await supabase.from('email_os_v11_saved_views').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, views: data || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = adminClient();
  const { data, error } = await supabase.from('email_os_v11_saved_views').insert({
    title: body.title,
    view_key: body.view_key || body.title?.toLowerCase()?.replace(/[^a-z0-9]+/g, '_'),
    filters: body.filters || {},
    layout: body.layout || {},
    owner_id: body.owner_id || null,
    is_shared: !!body.is_shared,
  }).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, view: data });
}
