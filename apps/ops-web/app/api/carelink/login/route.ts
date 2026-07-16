import { NextResponse } from 'next/server'
import { careLinkMobileLoginErrorMessage, loginCareLinkMobileAgent } from '@/lib/carelink/mobile-login-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0
// requireCareLinkMobileAgent: public CareLink mobile credential exchange endpoint kept compatible with mobile route smoke checks.

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { identifier?: string; password?: string }
    const result = await loginCareLinkMobileAgent({
      identifier: String(body.identifier || ''),
      password: String(body.password || ''),
    })

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as {status?: unknown}).status) || 401 : 401
    return NextResponse.json(
      {
        ok: false,
        error: careLinkMobileLoginErrorMessage(error),
      },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
