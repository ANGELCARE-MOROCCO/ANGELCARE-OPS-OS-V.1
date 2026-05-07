import { NextResponse } from 'next/server';
import { buildEmailOsApiResult } from '@/lib/email-os/v12/emailOsV12Runtime';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(buildEmailOsApiResult({
    action: String(body.action || 'unknown-action'),
    target: body.target,
    mailbox: body.mailbox,
    metadata: body.metadata,
  }));
}
