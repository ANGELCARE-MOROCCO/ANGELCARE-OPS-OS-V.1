import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    return NextResponse.json({ ok: true, data: workspace.records.filter((item) => item.missionKind !== 'dossier') }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink missions loading failed')
  }
}
