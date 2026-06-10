import { NextResponse } from 'next/server'
import { getMissionDossier, patchMission } from '@/lib/missions/repository'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; const data = await getMissionDossier(Number(id)); return NextResponse.json({ ok: true, data }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Dossier loading failed' }, { status: 500 }) }
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; const body = await request.json().catch(() => ({})); const data = await patchMission(Number(id), body); return NextResponse.json({ ok: true, data }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Dossier update failed' }, { status: 500 }) }
}
