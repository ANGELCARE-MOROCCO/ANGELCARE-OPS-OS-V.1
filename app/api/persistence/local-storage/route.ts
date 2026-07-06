import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    // This endpoint is intentionally defensive: localStorage persistence is convenience state,
    // not an authentication source of truth. It must never block login/dashboard access.
    await request.json().catch(() => ({}))

    return NextResponse.json(
      {
        ok: true,
        stored: false,
        mode: 'non_blocking_login_safe',
        message: 'Local storage persistence accepted without blocking runtime.',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: true,
        stored: false,
        mode: 'non_blocking_login_safe_error_swallowed',
        warning: error instanceof Error ? error.message : String(error || 'unknown'),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, stored: false, mode: 'non_blocking_login_safe' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
