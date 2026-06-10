import { NextResponse } from 'next/server'
import { getMissionDossier, patchMission } from '@/lib/missions/repository'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; const data = await getMissionDossier(Number(id)); if (!data) return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 }); return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Mission loading failed' }, { status: 500 }) }
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; const body = await request.json().catch(() => ({})); const data = await patchMission(Number(id), body); return NextResponse.json({ ok: true, data }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Mission update failed' }, { status: 500 }) }
}
