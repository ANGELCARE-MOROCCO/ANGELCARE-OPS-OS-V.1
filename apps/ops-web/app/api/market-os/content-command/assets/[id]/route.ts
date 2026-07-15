import { NextResponse } from 'next/server';
import { getContentCommandRuntimeUser } from '@/lib/market-os/content-command/auth/current-user';
import { assertContentCommandPermission } from '@/lib/market-os/content-command/auth/permissions';
import { getContentCommandAsset, updateContentCommandAsset } from '@/lib/market-os/content-command/repositories/assets-repository';
import { validateId } from '@/lib/market-os/content-command/validation/assets';
import { recordContentCommandAudit } from '@/lib/market-os/content-command/audit/audit';
import { emitContentCommandRealtimeEvent } from '@/lib/market-os/content-command/realtime/events';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'content:read');

  const { id } = await context.params;
  const validationError = validateId(id);
  if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

  const asset = await getContentCommandAsset(id);
  return NextResponse.json({ ok: true, asset });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'content:update');

  const { id } = await context.params;
  const input = await request.json();

  const asset = await updateContentCommandAsset(id, input);

  await recordContentCommandAudit({
    actorId: user.id,
    entityTable: 'market_content_assets',
    entityId: id,
    action: 'update',
    payload: input,
  });

  await emitContentCommandRealtimeEvent({
    eventName: 'content.asset.updated',
    entityTable: 'market_content_assets',
    entityId: id,
    payload: input,
  });

  return NextResponse.json({ ok: true, asset });
}