import { NextRequest, NextResponse } from 'next/server';
import { getEmailOsSnapshot, updateThreadAction } from '@/lib/email-os/v13/store';
export const runtime = 'nodejs';
export async function GET() { const s = await getEmailOsSnapshot(); return NextResponse.json({ threads: s.threads }); }
export async function POST(req: NextRequest) { const { threadIds, action, value } = await req.json(); return NextResponse.json({ threads: await updateThreadAction(threadIds || [], action, value) }); }
