import { NextResponse } from 'next/server'
import { generateSubMissions } from '@/lib/missions/dossiers'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const occurrences = Array.isArray(body.occurrences) ? body.occurrences : []
    if (!occurrences.length) return NextResponse.json({ ok: false, error: 'occurrences array is required' }, { status: 400 })
    const data = await generateSubMissions(Number(id), occurrences)
    return NextResponse.json({ ok: true, data })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Sub-mission generation failed' }, { status: 500 }) }
}
