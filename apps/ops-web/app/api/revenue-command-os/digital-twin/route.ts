import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { normalizeRevenueOsError, RevenueOsError } from '@/lib/revenue-command-os/errors'
import {
  mutateRevenueDigitalTwin,
  persistDigitalTwinValidation,
  readRevenueDigitalTwin,
  updateValidationIssueStatus,
} from '@/lib/revenue-command-os/digital-twin/repository'
import type { RevenueTwinEditableEntity, RevenueTwinMutationInput, RevenueTwinValidationIssue } from '@/lib/revenue-command-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canAccess(user: any, permission: string, allowView = false) {
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  if (['ceo', 'direction', 'admin'].includes(role)) return true
  const permissions = Array.isArray(user?.permissions) ? user.permissions.map(String) : []
  return permissions.includes('*') || permissions.includes(permission) || (allowView && (permissions.includes('revenue_os.view') || permissions.includes('revenue.view')))
}

function actor(user: any) {
  return {
    id: String(user?.id || ''),
    label: String(user?.name || user?.full_name || user?.email || 'Direction Revenue'),
  }
}

function respondError(error: unknown) {
  const normalized = normalizeRevenueOsError(error)
  return NextResponse.json({ ok: false, error: { code: normalized.code, message: normalized.message, recoverable: normalized.recoverable } }, { status: normalized.status })
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    if (!canAccess(user, 'revenue_os.digital_twin.manage', true)) return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Permission Digital Twin requise.' } }, { status: 403 })
    const { bootstrap, warnings } = await readRevenueDigitalTwin()
    return NextResponse.json({ ok: true, data: bootstrap, warnings }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return respondError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    if (!canAccess(user, 'revenue_os.digital_twin.manage')) return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Permission de gestion Digital Twin requise.' } }, { status: 403 })
    const body = await request.json()

    if (body?.action === 'run_validation') {
      const data = await persistDigitalTwinValidation(actor(user))
      return NextResponse.json({ ok: true, data })
    }

    if (body?.action === 'update_validation_status') {
      const issueId = typeof body?.payload?.issueId === 'string' ? body.payload.issueId : ''
      const nextStatus = body?.payload?.status as RevenueTwinValidationIssue['status']
      if (!issueId) throw new RevenueOsError('REVENUE_TWIN_INVALID_INPUT', 'Point de validation requis.', { status: 400 })
      const data = await updateValidationIssueStatus(issueId, nextStatus, actor(user))
      return NextResponse.json({ ok: true, data })
    }

    if (body?.action === 'mutate_entity') {
      const payload = body?.payload || {}
      const input: RevenueTwinMutationInput = {
        entity: payload.entity as RevenueTwinEditableEntity,
        operation: payload.operation,
        id: typeof payload.id === 'string' ? payload.id : undefined,
        payload: payload.data && typeof payload.data === 'object' ? payload.data : {},
      }
      const data = await mutateRevenueDigitalTwin(input, actor(user))
      return NextResponse.json({ ok: true, data }, { status: input.operation === 'create' ? 201 : 200 })
    }

    throw new RevenueOsError('REVENUE_TWIN_ACTION_NOT_ALLOWED', 'Action Digital Twin non supportée.', { status: 400 })
  } catch (error) {
    return respondError(error)
  }
}
