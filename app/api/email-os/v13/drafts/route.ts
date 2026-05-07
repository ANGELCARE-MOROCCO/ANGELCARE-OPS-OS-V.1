import { NextRequest, NextResponse } from 'next/server';
import { getEmailOsSnapshot, saveDraft } from '@/lib/email-os/v13/store';
export const runtime = 'nodejs';
export async function GET() { const s = await getEmailOsSnapshot(); return NextResponse.json({ drafts: s.drafts }); }
export async function POST(req: NextRequest) { return NextResponse.json({ draft: await saveDraft(await req.json()) }); }
