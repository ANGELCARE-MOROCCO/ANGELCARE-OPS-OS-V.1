import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'live',
    service: 'sanila-marketplace',
    revision: process.env.VERCEL_GIT_COMMIT_SHA || process.env.SANILA_RELEASE_SHA || process.env.GITHUB_SHA || 'unresolved',
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    observedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
