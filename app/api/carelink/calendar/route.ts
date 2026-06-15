import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    return NextResponse.json({ ok: true, data: workspace.calendar })
  } catch (error) {
    return NextResponse.json({ ok: false, data: null, error: error instanceof Error ? error.message : 'Load CareLink calendar failed' }, { status: 500 })
  }
}
