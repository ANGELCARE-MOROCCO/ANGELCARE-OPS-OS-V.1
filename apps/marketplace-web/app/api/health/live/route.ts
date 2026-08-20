import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const HEALTH_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-AngelCare-Health': 'live',
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: 'live',
      service: 'angelcare-marketplace',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: HEALTH_HEADERS,
    },
  )
}
