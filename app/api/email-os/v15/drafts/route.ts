import { NextResponse } from 'next/server';
import { createDraft, listDrafts } from '@/lib/email-os/v15/store';
import { writeAuditLog } from '@/lib/email-os/v15/audit';
export async function GET() { return NextResponse.json(await listDrafts()); }
export async function POST(req: Request) {
  const body = await req.json();
  const result = await createDraft(body);
  await writeAuditLog({ actor: body.actor || 'current-user', action: 'draft.create', targetType: 'draft', targetId: result.data?.id, result: result.status, details: body });
  return NextResponse.json(result);
}
