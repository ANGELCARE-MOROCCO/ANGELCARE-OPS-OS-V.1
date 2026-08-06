import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { apiError, tenantOf } from '@/lib/revenue-command-os/ai/api-access'
import { createRevenueOsObjective } from '@/lib/revenue-command-os/repository'
import { runGeminiStrategyAssembly } from '@/lib/revenue-command-os/strategy-brain/ai-orchestration'
import { mapFoundationObjectiveToStrategyObjective } from '@/lib/revenue-command-os/operating-spine/objective-mapper'
import { readRevenueOperatingSpine } from '@/lib/revenue-command-os/operating-spine/read-model'
import type { RevenueOperationLaunchInput } from '@/lib/revenue-command-os/operating-spine/types'
import type { RevenueOsPriority } from '@/lib/revenue-command-os/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function userIdOf(user: any): string {
  return String(user?.id || user?.email || 'current-user')
}

function actorLabelOf(user: any): string {
  return String(user?.name || user?.full_name || user?.email || 'Direction Revenue')
}

function requiredText(value: unknown, label: string, minimum: number): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length < minimum) throw Object.assign(new Error(`${label} doit contenir au moins ${minimum} caractères.`), { status: 422 })
  return text
}

function optionalNumber(value: unknown): number | undefined {
  if (value === '' || value == null) return undefined
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw Object.assign(new Error('Une valeur numérique positive est requise.'), { status: 422 })
  return number
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean)
  return []
}

function launchInput(value: any): RevenueOperationLaunchInput {
  const priority = ['low', 'normal', 'high', 'critical'].includes(value?.priority) ? value.priority : 'high'
  const riskAppetite = ['conservative', 'balanced', 'aggressive'].includes(value?.riskAppetite) ? value.riskAppetite : 'balanced'
  const targetSegments = list(value?.targetSegments)
  const territories = list(value?.territories)
  const approvedChannels = list(value?.approvedChannels)
  const successDefinition = list(value?.successDefinition)
  const failureDefinition = list(value?.failureDefinition)

  const marginPercent = optionalNumber(value?.marginTarget)
  return {
    title: requiredText(value?.title, 'Objectif', 8),
    mandate: requiredText(value?.mandate, 'Mandat', 20),
    businessUnit: requiredText(value?.businessUnit, 'Business unit', 3),
    targetMarket: requiredText(value?.targetMarket, 'Marché cible', 3),
    targetSegments,
    territories,
    targetAccounts: list(value?.targetAccounts),
    revenueTarget: optionalNumber(value?.revenueTarget),
    marginTarget: marginPercent == null ? undefined : Math.min(1, marginPercent > 1 ? marginPercent / 100 : marginPercent),
    horizon: requiredText(value?.horizon, 'Horizon', 2),
    deadline: typeof value?.deadline === 'string' && value.deadline ? value.deadline : undefined,
    priority,
    budgetLimit: optionalNumber(value?.budgetLimit),
    capacityLimit: optionalNumber(value?.capacityLimit),
    approvedOffers: list(value?.approvedOffers),
    approvedChannels,
    constraints: list(value?.constraints),
    successDefinition,
    failureDefinition,
    riskAppetite,
    authorityLevel: requiredText(value?.authorityLevel || 'Direction générale', 'Niveau d’autorité', 2),
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return apiError('UNAUTHENTICATED', 'Authentification requise.', 401)
  try {
    const tenantId = tenantOf(user)
    const data = await readRevenueOperatingSpine(tenantId)
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiError('OPERATING_SPINE_READ_FAILED', error instanceof Error ? error.message : String(error), 500)
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return apiError('UNAUTHENTICATED', 'Authentification requise.', 401)
  try {
    const body = await request.json()
    if (body?.action !== 'launch_operation') return apiError('INVALID_ACTION', 'Action Operating Spine non supportée.', 422)

    const input = launchInput(body.payload)
    const tenantId = tenantOf(user, body.payload)
    const userId = userIdOf(user)
    const foundationPriority: RevenueOsPriority = input.priority === 'normal' ? 'medium' : input.priority
    const objective = await createRevenueOsObjective({
      title: input.title,
      mandate: input.mandate,
      businessUnit: input.businessUnit,
      targetMarket: input.targetMarket,
      horizon: input.horizon,
      priority: foundationPriority,
      executionMode: 'live',
    }, { id: userId, label: actorLabelOf(user) })

    const strategyObjective = mapFoundationObjectiveToStrategyObjective(objective, input, tenantId, userId)
    const result = await runGeminiStrategyAssembly({
      objective: strategyObjective,
      userId,
      idempotencyKey: request.headers.get('idempotency-key') || body.idempotencyKey || crypto.randomUUID(),
    })
    const snapshot = await readRevenueOperatingSpine(tenantId)
    return NextResponse.json({
      ok: true,
      data: { objective, run: result, snapshot },
      mode: 'live',
      externalActions: true,
    }, { status: 201 })
  } catch (error) {
    const typed = error as { status?: number; message?: string }
    return apiError('OPERATING_SPINE_LAUNCH_FAILED', String(typed.message || error), Number(typed.status || 500))
  }
}
