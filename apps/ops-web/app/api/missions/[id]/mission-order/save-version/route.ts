import { NextResponse } from 'next/server'
import { saveMissionOrderVersion } from '@/lib/missions/mission-order'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const body = await request.json().catch(() => ({})); return NextResponse.json({ ok: true, data: await saveMissionOrderVersion(Number(id), body.snapshot || {}, body.changeSummary || body.change_summary) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Mission order version save failed' }, { status: 500 }) } }
