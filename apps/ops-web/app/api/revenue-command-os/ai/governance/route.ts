import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createServiceClient } from '@/lib/supabase/server'
import { aiActorOf, aiRights, apiError } from '@/lib/revenue-command-os/ai/api-access'
import { estimateAiCostUsd, preflightGovernedAiRequest } from '@/lib/ai-provider-control/governor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function moduleSummary() {
  const supabase = (await createServiceClient()) as any
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const [quota, policies, schedules, requests, usage, reuse] = await Promise.all([
    supabase.from('ai_provider_quota_policies').select('*').eq('scope_type', 'module').eq('scope_key', 'revenue_os').maybeSingle(),
    supabase.from('ai_provider_command_policies').select('*').eq('module_key', 'revenue_os').order('workspace_key'),
    supabase.from('ai_provider_command_schedules').select('*').eq('module_key', 'revenue_os').order('next_run_at', { ascending: true }),
    supabase.from('ai_provider_governed_requests').select('id,decision,status,command_code,workspace_key,provider_type,model_code,estimated_cost_usd,actual_cost_usd,created_at,completed_at,error_code').eq('module_key', 'revenue_os').order('created_at', { ascending: false }).limit(100),
    supabase.from('ai_provider_usage_ledger').select('request_count,input_tokens,output_tokens,estimated_cost_usd,occurred_at,command_code,outcome').eq('module_key', 'revenue_os').gte('occurred_at', weekStart.toISOString()).order('occurred_at', { ascending: false }).limit(2000),
    supabase.from('ai_provider_reuse_events').select('event_type,avoided_requests,avoided_input_tokens,avoided_output_tokens,avoided_cost_usd,created_at').eq('module_key', 'revenue_os').gte('created_at', weekStart.toISOString()).order('created_at', { ascending: false }).limit(1000),
  ])
  for (const result of [quota, policies, schedules, requests, usage, reuse]) {
    if (result.error) {
      const message = String(result.error.message || '')
      if (message.includes('does not exist') || message.includes('schema cache')) throw new Error('AI_PROVIDER_SOVEREIGNTY_PHASE5_REQUIRED')
      throw new Error(message)
    }
  }
  const usageRows = Array.isArray(usage.data) ? usage.data : []
  const reuseRows = Array.isArray(reuse.data) ? reuse.data : []
  const todayRows = usageRows.filter((row: any) => new Date(row.occurred_at) >= dayStart)
  const sum = (rows: any[], key: string) => rows.reduce((total, row) => total + Number(row[key] || 0), 0)
  const requestRows = Array.isArray(requests.data) ? requests.data : []
  const scheduleRows = Array.isArray(schedules.data) ? schedules.data : []
  return {
    generatedAt: new Date().toISOString(),
    quota: quota.data || null,
    commandPolicies: policies.data || [],
    schedules: scheduleRows,
    recentRequests: requestRows,
    rollups: {
      todayRequests: sum(todayRows, 'request_count'),
      weekRequests: sum(usageRows, 'request_count'),
      todayInputTokens: sum(todayRows, 'input_tokens'),
      weekInputTokens: sum(usageRows, 'input_tokens'),
      todayOutputTokens: sum(todayRows, 'output_tokens'),
      weekOutputTokens: sum(usageRows, 'output_tokens'),
      todayCostUsd: sum(todayRows, 'estimated_cost_usd'),
      weekCostUsd: sum(usageRows, 'estimated_cost_usd'),
      cacheHits: requestRows.filter((row: any) => row.decision === 'REUSE_CACHED').length,
      joinedRequests: requestRows.filter((row: any) => row.decision === 'JOIN_IN_FLIGHT').length,
      blockedRequests: requestRows.filter((row: any) => ['blocked','deferred','failed'].includes(row.status) || String(row.decision || '').startsWith('BLOCK_')).length,
      avoidedRequests: sum(reuseRows, 'avoided_requests'),
      avoidedTokens: sum(reuseRows, 'avoided_input_tokens') + sum(reuseRows, 'avoided_output_tokens'),
      avoidedCostUsd: sum(reuseRows, 'avoided_cost_usd'),
      activeSchedules: scheduleRows.filter((row: any) => row.enabled && row.status === 'active').length,
    },
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return apiError('UNAUTHENTICATED', 'Authentification requise.', 401)
  if (!aiRights(user).read) return apiError('FORBIDDEN', 'Permission IA Revenue requise.', 403)
  try {
    return NextResponse.json({ ok: true, data: await moduleSummary(), externalActions: false }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiError('AI_GOVERNANCE_UNAVAILABLE', error instanceof Error ? error.message : 'AI governance unavailable', 503)
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return apiError('UNAUTHENTICATED', 'Authentification requise.', 401)
  const rights = aiRights(user)
  if (!rights.generate) return apiError('FORBIDDEN', 'Permission de génération IA Revenue requise.', 403)
  try {
    const body = await request.json() as Record<string, unknown>
    if (Boolean(body.forceRefresh) && !rights.manage) {
      return apiError('FORBIDDEN_FORCE_REFRESH', 'Le rafraîchissement forcé exige la permission revenue_os.ai.manage.', 403)
    }
    const actor = aiActorOf(user, body)
    const estimatedInputTokens = Math.max(0, Number(body.estimatedInputTokens || 0))
    const estimatedOutputTokens = Math.max(0, Number(body.estimatedOutputTokens || 0))
    const data = await preflightGovernedAiRequest({
      moduleKey: 'revenue_os',
      workspaceKey: String(body.workspaceKey || '*'),
      capability: String(body.capability || 'general') as any,
      commandCode: String(body.commandCode || body.capability || 'REVENUE_AI_GENERAL'),
      requestedModel: String(body.requestedModel || process.env.GEMINI_PRIMARY_MODEL || 'gemini-2.5-flash'),
      promptVersion: String(body.promptVersion || '') || null,
      sourceRevision: String(body.sourceRevision || '') || null,
      requestPayload: body.requestPayload || {},
      triggerType: String(body.triggerType || 'manual') as any,
      scheduleKey: String(body.scheduleKey || '') || null,
      actorId: actor.id,
      estimatedRequests: Math.max(1, Number(body.estimatedRequests || 1)),
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostUsd: Math.max(0, Number(body.estimatedCostUsd ?? estimateAiCostUsd(estimatedInputTokens, estimatedOutputTokens))),
      forceRefresh: Boolean(body.forceRefresh),
    })
    return NextResponse.json({ ok: true, data, externalActions: false }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiError('AI_GOVERNANCE_PREFLIGHT_FAILED', error instanceof Error ? error.message : 'Preflight failed', 400)
  }
}
