import { NextResponse } from 'next/server';
import { listMailboxes } from '@/lib/email-os/v15/store';
export async function GET() { return NextResponse.json(await listMailboxes()); }
