import { NextResponse } from 'next/server'
import { submitMissionReport } from '@/lib/missions/reports'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const body = await request.json().catch(() => ({})); return NextResponse.json({ ok: true, data: await submitMissionReport(Number(id), body) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Report submission failed' }, { status: 500 }) } }
