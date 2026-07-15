import { NextResponse } from 'next/server';
import { getContentCommandRuntimeUser } from '@/lib/market-os/content-command/auth/current-user';
import { assertContentCommandPermission } from '@/lib/market-os/content-command/auth/permissions';
import { runContentCommandAi } from '@/lib/market-os/content-command/ai/ai-runtime';
import { recordContentCommandAudit } from '@/lib/market-os/content-command/audit/audit';

export async function POST(request: Request) {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'ai:run');

  const body = await request.json();
  const result = await runContentCommandAi(body);

  await recordContentCommandAudit({
    actorId: user.id,
    entityTable: 'market_content_ai_runs',
    entityId: crypto.randomUUID(),
    action: 'ai_run',
    payload: { action: body.action },
  });

  return NextResponse.json({ ok: true, result });
}