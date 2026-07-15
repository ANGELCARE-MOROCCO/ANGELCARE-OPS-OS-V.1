import { NextResponse } from 'next/server'
import { validateMissionReport } from '@/lib/missions/validation'
import { consumeContractSessionForMission } from '@/lib/missions/billing'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const body = await request.json().catch(() => ({})); const data = await validateMissionReport(Number(id), body.note); const billing = await consumeContractSessionForMission(Number(id)); return NextResponse.json({ ok: true, data, billing }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Validation failed' }, { status: 500 }) } }
