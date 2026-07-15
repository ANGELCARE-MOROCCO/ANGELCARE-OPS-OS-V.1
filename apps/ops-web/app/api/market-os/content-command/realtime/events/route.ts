import { NextResponse } from 'next/server';
import { getContentCommandRuntimeUser } from '@/lib/market-os/content-command/auth/current-user';
import { assertContentCommandPermission } from '@/lib/market-os/content-command/auth/permissions';
import { emitContentCommandRealtimeEvent } from '@/lib/market-os/content-command/realtime/events';

export async function POST(request: Request) {
  const user = await getContentCommandRuntimeUser();
  assertContentCommandPermission(user.role, 'content:update');

  const body = await request.json();
  await emitContentCommandRealtimeEvent(body);

  return NextResponse.json({ ok: true });
}