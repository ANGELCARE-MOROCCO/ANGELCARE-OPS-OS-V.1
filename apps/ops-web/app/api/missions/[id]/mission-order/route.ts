import { NextResponse } from 'next/server'
import { getMissionOrder, patchMissionOrder } from '@/lib/missions/mission-order'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; return NextResponse.json({ ok: true, data: await getMissionOrder(Number(id)) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Mission order loading failed' }, { status: 500 }) } }
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const body = await request.json().catch(() => ({})); return NextResponse.json({ ok: true, data: await patchMissionOrder(Number(id), body) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Mission order update failed' }, { status: 500 }) } }
