import { NextResponse } from 'next/server';
import { getContentCommandRuntimeUser } from '@/lib/market-os/content-command/auth/current-user';
import { assertContentCommandPermission } from '@/lib/market-os/content-command/auth/permissions';
import { recordContentCommandAudit } from '@/lib/market-os/content-command/audit/audit';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'approval:review');

  const { id } = await context.params;
  const body = await request.json();

  await recordContentCommandAudit({
    actorId: user.id,
    entityTable: 'market_content_approvals',
    entityId: id,
    action: 'approval_update',
    payload: body,
  });

  return NextResponse.json({
    ok: true,
    message: 'Approval route scaffold reached. Wire repository update here.',
  });
}