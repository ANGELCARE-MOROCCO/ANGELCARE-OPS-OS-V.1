import { NextResponse } from 'next/server';
import { getContentCommandRuntimeUser } from '@/lib/market-os/content-command/auth/current-user';
import { assertContentCommandPermission } from '@/lib/market-os/content-command/auth/permissions';
import { queueContentCommandPublication } from '@/lib/market-os/content-command/repositories/publications-repository';
import { recordContentCommandAudit } from '@/lib/market-os/content-command/audit/audit';

export async function POST(request: Request) {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'publishing:queue');

  const body = await request.json();
  const publication = await queueContentCommandPublication(body);

  await recordContentCommandAudit({
    actorId: user.id,
    entityTable: 'market_content_publications',
    entityId: publication.id,
    action: 'publication_queued',
    payload: body,
  });

  return NextResponse.json({ ok: true, publication });
}