import { NextRequest } from 'next/server'
import {
  approveTenantSupportAccess,
  cancelTenantAdminInvitation,
  changeTenantAdminStatus,
  endTenantSupportAccess,
  getTenantAccessSnapshot,
  launchTenantSupportAccess,
  requestTenantPasswordReset,
  requestTenantSupportAccess,
  revokeTenantAdminSessions,
  sendTenantAdminInvitation,
  transferTenantOwnership,
  upsertTenantAccessAccount,
} from '@/lib/angelcare360/operator/tenant-access'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    return operatorJson({
      ok: true,
      snapshot: await getTenantAccessSnapshot({
        clientId: request.nextUrl.searchParams.get('clientId'),
        tenantId: request.nextUrl.searchParams.get('tenantId'),
      }),
    })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    const operation = body?.operation || ''
    const payload = body?.payload || {}
    if (!operation) return operatorJson({ ok: false, error: 'Opération Tenant Access manquante.' }, 422)

    const handlers: Record<string, (value: unknown) => Promise<unknown>> = {
      'account.upsert': upsertTenantAccessAccount,
      'account.status': changeTenantAdminStatus,
      'invitation.send': sendTenantAdminInvitation,
      'invitation.cancel': cancelTenantAdminInvitation,
      'password.reset': requestTenantPasswordReset,
      'sessions.revoke': revokeTenantAdminSessions,
      'ownership.transfer': transferTenantOwnership,
      'support-access.request': requestTenantSupportAccess,
      'support-access.approve': approveTenantSupportAccess,
      'support-access.launch': launchTenantSupportAccess,
      'support-access.end': endTenantSupportAccess,
    }
    const handler = handlers[operation]
    if (!handler) return operatorJson({ ok: false, error: 'Opération Tenant Access inconnue.' }, 400)
    const result = await handler(payload) as { ok?: boolean; error?: string; supportSessionId?: string; supportUrl?: string }
    const response = operatorJson(result, result?.ok === false ? 422 : 200)
    if (operation === 'support-access.launch' && result.ok && result.supportSessionId) {
      response.cookies.set('angelcare360_support_access', result.supportSessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/angelcare-360-command-center', maxAge: 86400 })
    }
    if (operation === 'support-access.end' && result.ok) response.cookies.set('angelcare360_support_access', '', { httpOnly: true, expires: new Date(0), path: '/angelcare-360-command-center' })
    return response
  } catch (error) {
    return operatorRouteError(error)
  }
}
