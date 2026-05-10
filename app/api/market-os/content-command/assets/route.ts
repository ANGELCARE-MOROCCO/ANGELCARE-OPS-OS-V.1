import { NextResponse } from 'next/server';
import { getContentCommandRuntimeUser } from '@/lib/market-os/content-command/auth/current-user';
import { assertContentCommandPermission } from '@/lib/market-os/content-command/auth/permissions';
import { createContentCommandAsset, listContentCommandAssets } from '@/lib/market-os/content-command/repositories/assets-repository';
import { validateCreateAssetInput } from '@/lib/market-os/content-command/validation/assets';
import { recordContentCommandAudit } from '@/lib/market-os/content-command/audit/audit';
import { emitContentCommandRealtimeEvent } from '@/lib/market-os/content-command/realtime/events';

export async function GET() {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'content:read');

  const assets = await listContentCommandAssets();
  return NextResponse.json({ ok: true, assets });
}

export async function POST(request: Request) {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'content:create');

  const input = await request.json();
  const validationError = validateCreateAssetInput(input);
  if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

  const asset = await createContentCommandAsset(input);

  await recordContentCommandAudit({
    actorId: user.id,
    entityTable: 'market_content_assets',
    entityId: asset.id,
    action: 'create',
    payload: { title: asset.title },
  });

  await emitContentCommandRealtimeEvent({
    eventName: 'content.asset.created',
    entityTable: 'market_content_assets',
    entityId: asset.id,
    payload: { title: asset.title },
  });

  return NextResponse.json({ ok: true, asset });
}