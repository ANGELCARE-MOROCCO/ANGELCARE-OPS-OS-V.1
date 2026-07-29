import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser, type MarketingAiPermission } from '@/lib/market-os/marketing-ai/auth'
import { runContentResearchAgent } from '@/lib/market-os/content-research/orchestrator'
import { getTavilyUsage } from '@/lib/market-os/content-research/providers/tavily'
import { testOpenRouter } from '@/lib/market-os/content-research/providers/openrouter'
import {
  acknowledgeResearchAlert,
  cloneResearchAgent,
  normalizeAgentPatch,
  saveProviderPolicy,
  saveResearchAgent,
} from '@/lib/market-os/content-research/repository'
import { record, stringValue } from '@/lib/market-os/content-research/policy'

export const dynamic = 'force-dynamic'

type Body = { action?: unknown; payload?: unknown }

const permissionByAction: Record<string, MarketingAiPermission> = {
  save_agent_policy: 'manage',
  set_agent_status: 'manage',
  clone_agent: 'manage',
  save_provider_policy: 'govern',
  test_provider: 'manage',
  run_now: 'run',
  acknowledge_alert: 'manage',
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Body
    const action = stringValue(body.action)
    if (!action) throw new Error('ACTION_REQUIRED')
    const permission = permissionByAction[action]
    if (!permission) throw new Error('INVALID_RESEARCH_CONTROL_ACTION')
    const actor = await requireMarketingAiUser(permission)
    const payload = record(body.payload)

    if (action === 'save_agent_policy') {
      const agentId = stringValue(payload.agentId)
      if (!agentId) throw new Error('AGENT_ID_REQUIRED')
      const result = await saveResearchAgent({
        actorId: actor.id,
        actorName: actor.name,
        agentId,
        patch: normalizeAgentPatch(payload.patch),
        reason: stringValue(payload.reason, 'Mise à jour depuis Contrôle Recherche IA.'),
      })
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'set_agent_status') {
      const agentId = stringValue(payload.agentId)
      const status = stringValue(payload.status)
      if (!agentId || !['draft', 'active', 'paused', 'retired'].includes(status)) throw new Error('INVALID_AGENT_STATUS')
      const result = await saveResearchAgent({
        actorId: actor.id,
        actorName: actor.name,
        agentId,
        patch: { status },
        reason: stringValue(payload.reason, `État agent → ${status}`),
      })
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'clone_agent') {
      const agentId = stringValue(payload.agentId)
      const code = stringValue(payload.code).toUpperCase().replace(/[^A-Z0-9_]+/g, '_')
      const name = stringValue(payload.name)
      if (!agentId || !code || !name) throw new Error('CLONE_AGENT_FIELDS_REQUIRED')
      const result = await cloneResearchAgent({ actorId: actor.id, actorName: actor.name, agentId, code, name })
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'save_provider_policy') {
      const providerKey = stringValue(payload.providerKey)
      if (!providerKey) throw new Error('PROVIDER_KEY_REQUIRED')
      const result = await saveProviderPolicy({
        actorId: actor.id,
        actorName: actor.name,
        providerKey,
        status: payload.status === undefined ? undefined : stringValue(payload.status),
        enabled: payload.enabled === undefined ? undefined : Boolean(payload.enabled),
        configuration: payload.configuration === undefined ? undefined : record(payload.configuration),
        limits: payload.limits === undefined ? undefined : record(payload.limits),
      })
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'test_provider') {
      const providerKey = stringValue(payload.providerKey)
      if (!providerKey) throw new Error('PROVIDER_KEY_REQUIRED')
      const health = providerKey === 'tavily'
        ? await getTavilyUsage()
        : providerKey === 'openrouter'
          ? await testOpenRouter()
          : { available: false, configured: false, error: 'SEARXNG_NOT_CONFIGURED' }
      const result = await saveProviderPolicy({
        actorId: actor.id,
        actorName: actor.name,
        providerKey,
        health,
        tested: true,
        status: health.available ? 'active' : providerKey === 'searxng' ? 'not_configured' : 'degraded',
      })
      return NextResponse.json({ ok: true, result, health })
    }

    if (action === 'run_now') {
      const agentId = stringValue(payload.agentId)
      if (!agentId) throw new Error('AGENT_ID_REQUIRED')
      const result = await runContentResearchAgent({
        actorId: actor.id,
        actorName: actor.name,
        agentIdOrCode: agentId,
        objective: stringValue(payload.objective),
        query: stringValue(payload.query),
        priority: stringValue(payload.priority, 'normal'),
        triggerType: 'manual_override',
        overridePolicy: record(payload.overridePolicy),
      })
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'acknowledge_alert') {
      const alertId = stringValue(payload.alertId)
      if (!alertId) throw new Error('ALERT_ID_REQUIRED')
      const result = await acknowledgeResearchAlert({ actorId: actor.id, actorName: actor.name, alertId })
      return NextResponse.json({ ok: true, result })
    }

    throw new Error('INVALID_RESEARCH_CONTROL_ACTION')
  } catch (error) {
    return apiErrorResponse(error)
  }
}
