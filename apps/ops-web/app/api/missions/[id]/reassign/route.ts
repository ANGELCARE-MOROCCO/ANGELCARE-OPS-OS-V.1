import { NextResponse } from 'next/server'
import { assignMissionCaregiver } from '@/lib/missions/assignment'
export const dynamic = 'force-dynamic'
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; const body = await request.json().catch(() => ({})); const caregiverId = body.caregiverId ?? body.caregiver_id ?? null; const data = await assignMissionCaregiver(Number(id), caregiverId ? Number(caregiverId) : null, body.scope || 'single'); return NextResponse.json({ ok: true, data }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Assignment failed' }, { status: 500 }) }
}
