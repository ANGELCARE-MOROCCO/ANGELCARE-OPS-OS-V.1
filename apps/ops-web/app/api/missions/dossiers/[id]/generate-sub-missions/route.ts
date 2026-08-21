import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { generateSubMissions } from '@/lib/missions/dossiers'
export const dynamic = 'force-dynamic'
async function POST__angelcareGovernedImpl(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const occurrences = Array.isArray(body.occurrences) ? body.occurrences : []
    if (!occurrences.length) return NextResponse.json({ ok: false, error: 'occurrences array is required' }, { status: 400 })
    const data = await generateSubMissions(Number(id), occurrences)
    return NextResponse.json({ ok: true, data })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Sub-mission generation failed' }, { status: 500 }) }
}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/missions/dossiers/[id]/generate-sub-missions',
  },
  POST__angelcareGovernedImpl,
)
