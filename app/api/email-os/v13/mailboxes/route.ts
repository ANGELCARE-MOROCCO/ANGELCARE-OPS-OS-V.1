import { NextRequest, NextResponse } from 'next/server';
import { getEmailOsSnapshot, upsertMailbox } from '@/lib/email-os/v13/store';
export const runtime = 'nodejs';
export async function GET() { const s = await getEmailOsSnapshot(); return NextResponse.json({ mailboxes: s.mailboxes }); }
export async function POST(req: NextRequest) { const body = await req.json(); return NextResponse.json({ mailbox: await upsertMailbox(body) }); }
