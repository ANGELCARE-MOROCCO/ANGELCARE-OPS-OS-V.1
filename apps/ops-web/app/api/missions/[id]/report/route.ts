import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { submitMissionReport } from '@/lib/missions/reports'
export const dynamic = 'force-dynamic'
async function POST__angelcareGovernedImpl(request: Request, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; const body = await request.json().catch(() => ({})); return NextResponse.json({ ok: true, data: await submitMissionReport(Number(id), body) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Report submission failed' }, { status: 500 }) } }

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/missions/[id]/report',
  },
  POST__angelcareGovernedImpl,
)
