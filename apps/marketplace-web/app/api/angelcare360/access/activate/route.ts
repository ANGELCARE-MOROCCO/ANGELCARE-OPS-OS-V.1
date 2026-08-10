import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { completeTenantAccessToken, confirmTenantMfaEnrollment, inspectTenantAccessToken } from '@/lib/angelcare360/operator/tenant-access'
import { resolveBrandRuntime } from '@/lib/angelcare360/operator/branding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const mode = request.nextUrl.searchParams.get('mode') === 'reset' ? 'reset' : 'invite'
  const result = await inspectTenantAccessToken(token, mode)
  const account = result.ok ? (result as any).account || null : null
  const brandRuntime = account ? await resolveBrandRuntime({ clientId: account.client_id, tenantId: account.tenant_id }).catch(() => null) : null
  return NextResponse.json(result.ok ? { ...result, tokenType: mode === 'reset' ? 'password_reset' : 'invitation', client: account?.client || null, tenant: account?.tenant || null, brandRuntime } : result, { status: result.ok ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token?: string; mode?: string; password?: string; action?: string; code?: string } | null
  if (!body) return NextResponse.json({ ok: false, error: 'Requête invalide.' }, { status: 422 })
  const result = body.action === 'mfa.confirm'
    ? await confirmTenantMfaEnrollment({ token: String(body.token || ''), code: String(body.code || '') })
    : await completeTenantAccessToken({ token: String(body.token || ''), mode: body.mode === 'reset' ? 'reset' : 'invite', password: String(body.password || '') })
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
