import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true, service: 'AngelCare CareLink Enterprise', mode: 'single-module-upgrade', mobileRoute: '/carelink', opsRoute: '/carelink-ops' })
}
