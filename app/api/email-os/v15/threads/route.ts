import { NextResponse } from 'next/server';
import { listThreads, updateThreadStatus } from '@/lib/email-os/v15/store';
import { writeAuditLog } from '@/lib/email-os/v15/audit';

export async function GET() { return NextResponse.json(await listThreads()); }

export async function PATCH(req: Request) {
  const body = await req.json();
  const result = await updateThreadStatus(body.id, body.status);
  await writeAuditLog({ actor: body.actor || 'current-user', action: 'thread.status.update', targetType: 'thread', targetId: body.id, result: result.status, details: body });
  return NextResponse.json(result);
}
