import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { normalizeRevenueOsError, RevenueOsError } from '@/lib/revenue-command-os/errors'
import { createRevenueOsObjective, readRevenueOsFoundation } from '@/lib/revenue-command-os/repository'
import type { RevenueOsExecutionMode, RevenueOsObjectiveInput, RevenueOsPriority } from '@/lib/revenue-command-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canAccess(user: any, permission: string, allowLegacyRevenueView = false) {
  const role = String(user?.role || user?.role_key || '').toLowerCase()
  if (role === 'ceo' || role === 'direction' || role === 'admin') return true
  const permissions = Array.isArray(user?.permissions) ? user.permissions.map(String) : []
  return permissions.includes('*') || permissions.includes(permission) || (allowLegacyRevenueView && permissions.includes('revenue.view'))
}

function respondError(error: unknown) {
  const normalized = normalizeRevenueOsError(error)
  return NextResponse.json({
    ok: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      recoverable: normalized.recoverable,
    },
  }, { status: normalized.status })
}

function stringField(value: unknown, name: string, minimum: number) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length < minimum) {
    throw new RevenueOsError('REVENUE_OS_INVALID_INPUT', `${name} doit contenir au moins ${minimum} caractères.`, { status: 400 })
  }
  return text
}

function objectiveInput(payload: any): RevenueOsObjectiveInput {
  const priorities: RevenueOsPriority[] = ['critical', 'high', 'medium', 'low']
  const modes: RevenueOsExecutionMode[] = ['shadow', 'recommend']
  const priority = priorities.includes(payload?.priority) ? payload.priority : 'high'
  const executionMode = modes.includes(payload?.executionMode) ? payload.executionMode : 'shadow'
  return {
    title: stringField(payload?.title, 'Objectif', 8),
    mandate: stringField(payload?.mandate, 'Mandat', 20),
    businessUnit: stringField(payload?.businessUnit, 'Business unit', 3),
    targetMarket: stringField(payload?.targetMarket, 'Marché cible', 3),
    horizon: stringField(payload?.horizon, 'Horizon', 2),
    priority,
    executionMode,
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    if (!canAccess(user, 'revenue_os.view', true)) return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Permission Revenue OS requise.' } }, { status: 403 })
    const { bootstrap, warnings } = await readRevenueOsFoundation()
    return NextResponse.json({ ok: true, data: bootstrap, warnings }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return respondError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
    if (!canAccess(user, 'revenue_os.objectives.manage')) return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Permission de gestion des objectifs requise.' } }, { status: 403 })

    const body = await request.json()
    if (body?.action !== 'create_objective') {
      throw new RevenueOsError('REVENUE_OS_INVALID_INPUT', 'Action Revenue OS non supportée en Phase 1.', { status: 400 })
    }

    const data = await createRevenueOsObjective(objectiveInput(body.payload), {
      id: String((user as any).id || ''),
      label: String((user as any).name || (user as any).full_name || (user as any).email || 'Direction Revenue'),
    })
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    return respondError(error)
  }
}
