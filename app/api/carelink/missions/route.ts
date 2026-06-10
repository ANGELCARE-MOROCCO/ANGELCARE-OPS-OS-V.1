import { NextResponse } from 'next/server'
import { listMissionControlRecords } from '@/lib/missions/repository'
export const dynamic = 'force-dynamic'
export async function GET() { try { const data = (await listMissionControlRecords()).filter((item) => item.missionKind !== 'dossier'); return NextResponse.json({ ok: true, data }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'CareLink missions loading failed', data: [] }, { status: 500 }) } }
