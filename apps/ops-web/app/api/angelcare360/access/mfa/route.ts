import { NextRequest, NextResponse } from 'next/server'
import { confirmCurrentTenantMfaChallenge, inspectCurrentTenantMfaChallenge } from '@/lib/angelcare360/operator/tenant-access'
import { resolveCurrentUserBrandRuntime } from '@/lib/angelcare360/operator/branding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await inspectCurrentTenantMfaChallenge()
  const brandRuntime = result.ok ? await resolveCurrentUserBrandRuntime().catch(() => null) : null
  return NextResponse.json(result.ok ? { ...result, brandRuntime } : result, { status: result.ok ? 200 : 401 })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { code?: string } | null
  const result = await confirmCurrentTenantMfaChallenge(String(body?.code || ''))
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
