import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { INTELLIGENCE_TENANT_KEY, INTELLIGENCE_VIEW_PREFIX, intelligenceEnvironment } from '@/lib/flashcards-os/intelligence/config'
import { tavilySearch, tavilyContentHash, type TavilySearchResult } from '@/lib/flashcards-os/intelligence/adapters/tavily'
import { openRouterStructuredCompletion, type OpenRouterStructuredResult } from '@/lib/flashcards-os/intelligence/adapters/openrouter'
import { openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import { loadModelProfile } from '@/lib/flashcards-os/intelligence/server/repository'
import type { ActorContext, ProductDesign, ResearchMission } from '@/lib/flashcards-os/intelligence/types'

function table(client: Awaited<ReturnType<typeof createServiceClient>>, name: string) {
  return client.from(`${INTELLIGENCE_VIEW_PREFIX}${name}`)
}

function hash(value: unknown) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function domain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() } catch { return '' }
}

function runCode(provider: string, entityId: string) {
  return `${provider.toUpperCase()}-${entityId.slice(0, 8)}-${Date.now()}`
}

async function recordProviderHealth(client: Awaited<ReturnType<typeof createServiceClient>>, input: {
  provider: 'tavily' | 'openrouter'
  status: 'success' | 'failure'
  operation: string
  latencyMs: number
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}) {
  await table(client, 'provider_health_events').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    provider: input.provider,
    status: input.status,
    operation: input.operation,
    latency_ms: input.latencyMs,
    error_message: input.errorMessage || null,
    metadata: input.metadata || {},
  })
}

async function startRun(client: Awaited<ReturnType<typeof createServiceClient>>, input: {
  taskProfile: string
  provider: 'tavily' | 'openrouter' | 'internal'
  entityType: string
  entityId: string
  modelRequested?: string | null
  inputPayload: unknown
  actorId?: string | null
}) {
  const code = runCode(input.provider, input.entityId)
  const { data, error } = await table(client, 'intelligence_runs').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    run_code: code,
    task_profile: input.taskProfile,
    status: 'running',
    provider: input.provider,
    entity_type: input.entityType,
    entity_id: input.entityId,
    model_requested: input.modelRequested || null,
    input_hash: hash(input.inputPayload),
    context_summary: typeof input.inputPayload === 'string' ? input.inputPayload.slice(0, 1000) : JSON.stringify(input.inputPayload).slice(0, 1000),
    created_by: input.actorId || null,
    started_at: new Date().toISOString(),
  }).select('*').single()
  if (error) throw error
  return data
}

async function completeRun(client: Awaited<ReturnType<typeof createServiceClient>>, runId: string, result: {
  modelUsed?: string | null
  fallbackUsed?: boolean
  providerName?: string | null
  output: unknown
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  costUsd?: number
  latencyMs: number
  responseId?: string | null
}) {
  const now = new Date().toISOString()
  const { error } = await table(client, 'intelligence_runs').update({
    status: 'succeeded',
    model_used: result.modelUsed || null,
    fallback_used: Boolean(result.fallbackUsed),
    provider_route: result.providerName || null,
    output_hash: hash(result.output),
    output_snapshot: result.output,
    prompt_tokens: result.promptTokens || 0,
    completion_tokens: result.completionTokens || 0,
    total_tokens: result.totalTokens || 0,
    cost_usd: result.costUsd || 0,
    latency_ms: result.latencyMs,
    provider_response_id: result.responseId || null,
    completed_at: now,
    updated_at: now,
  }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', runId)
  if (error) throw error
}

async function failRun(client: Awaited<ReturnType<typeof createServiceClient>>, runId: string, error: unknown, latencyMs: number) {
  const typed = error as Error & { code?: string; status?: number }
  await table(client, 'intelligence_runs').update({
    status: typed.code === 'FLASHCARDS_INTELLIGENCE_PRIVACY_BLOCK' ? 'blocked' : 'failed',
    error_code: typed.code || 'INTELLIGENCE_RUN_ERROR',
    error_message: typed.message || 'Unknown intelligence error.',
    latency_ms: latencyMs,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', runId)
}

async function recordUsage(client: Awaited<ReturnType<typeof createServiceClient>>, input: {
  provider: 'tavily' | 'openrouter'
  operation: string
  runId: string
  missionId?: string | null
  credits?: number
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  costUsd?: number
  model?: string | null
}) {
  await table(client, 'usage_ledger').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    provider: input.provider,
    operation: input.operation,
    intelligence_run_id: input.runId,
    mission_id: input.missionId || null,
    credits: input.credits || 0,
    prompt_tokens: input.promptTokens || 0,
    completion_tokens: input.completionTokens || 0,
    total_tokens: input.totalTokens || 0,
    cost_usd: input.costUsd || 0,
    model: input.model || null,
  })
}

async function recordOpenRouterResult(client: Awaited<ReturnType<typeof createServiceClient>>, runId: string, result: OpenRouterStructuredResult, operation: string, missionId?: string | null) {
  await completeRun(client, runId, {
    modelUsed: result.modelUsed,
    fallbackUsed: result.fallbackUsed,
    providerName: result.providerName,
    output: result.data,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    costUsd: result.costUsd,
    latencyMs: result.latencyMs,
    responseId: result.responseId,
  })
  await recordUsage(client, {
    provider: 'openrouter',
    operation,
    runId,
    missionId,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    costUsd: result.costUsd,
    model: result.modelUsed,
  })
  await table(client, 'provider_calls').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    intelligence_run_id: runId,
    provider: 'openrouter',
    operation,
    request_model: result.modelRequested,
    response_model: result.modelUsed,
    provider_route: result.providerName,
    provider_response_id: result.responseId,
    status: 'succeeded',
    latency_ms: result.latencyMs,
    usage_payload: {
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      costUsd: result.costUsd,
    },
  })
  if (result.redactionFindings.length) {
    await table(client, 'redaction_events').insert(result.redactionFindings.map((finding) => ({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      intelligence_run_id: runId,
      category: finding.category,
      match_count: finding.count,
      blocked: finding.blocked,
      description: finding.description,
    })))
  }
}

async function enqueueJob(client: Awaited<ReturnType<typeof createServiceClient>>, input: {
  idempotencyKey: string
  jobType: string
  entityType: string
  entityId: string
  payload: Record<string, unknown>
  priority?: number
  actorId?: string | null
}) {
  const { data, error } = await table(client, 'intelligence_jobs').upsert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    idempotency_key: input.idempotencyKey,
    job_type: input.jobType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    status: 'queued',
    priority: input.priority || 50,
    max_attempts: intelligenceEnvironment().governance.maximumRetries,
    payload: input.payload,
    available_at: new Date().toISOString(),
    created_by: input.actorId || null,
  }, { onConflict: 'tenant_key,idempotency_key' }).select('*').single()
  if (error) throw error
  return data
}

async function persistSearchSource(client: Awaited<ReturnType<typeof createServiceClient>>, mission: any, result: TavilySearchResult, requestId: string | null, queryId: string | null) {
  const content = result.rawContent || result.content
  const contentHash = tavilyContentHash({ url: result.url, content })
  const sourceDomain = domain(result.url)
  const { data: existing } = await table(client, 'research_sources').select('id,content_hash').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('content_hash', contentHash).maybeSingle()
  const duplicateGroup = existing?.id ? `dup-${existing.id}` : null
  const relevance = Math.round(Math.max(0, Math.min(1, result.score)) * 100)
  const freshness = result.publishedDate ? 70 : 45
  const authority = /\.gov\.|\.edu\.|who\.int|unicef|unesco|nih\.gov|nhs\.uk/i.test(sourceDomain) ? 88 : /org|foundation|institute|university/i.test(sourceDomain) ? 72 : 56
  const quality = Math.round(relevance * .45 + freshness * .2 + authority * .35)
  const { data, error } = await table(client, 'research_sources').upsert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    mission_id: mission.id,
    research_query_id: queryId,
    title: result.title,
    url: result.url,
    canonical_url: result.url.split('#')[0],
    domain: sourceDomain,
    publication_date: result.publishedDate,
    retrieval_date: new Date().toISOString(),
    source_category: 'web',
    relevance_score: relevance,
    freshness_score: freshness,
    authority_score: authority,
    quality_score: quality,
    duplicate_group: duplicateGroup,
    review_status: duplicateGroup ? 'needs_verification' : 'pending',
    normalized_content: content,
    content_preview: content.slice(0, 1200),
    content_hash: contentHash,
    tavily_request_id: requestId,
    favicon_url: result.favicon,
    metadata: { tavilyScore: result.score },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'tenant_key,mission_id,canonical_url' }).select('*').single()
  if (error) throw error
  await table(client, 'source_snapshots').insert({
    tenant_key: INTELLIGENCE_TENANT_KEY,
    source_id: data.id,
    content_hash: contentHash,
    normalized_content: content,
    retrieved_at: new Date().toISOString(),
    provider_request_id: requestId,
  })
  if (duplicateGroup && existing) {
    await table(client, 'source_duplicates').upsert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      source_id: data.id,
      duplicate_of_source_id: existing.id,
      similarity_score: 100,
      detection_method: 'content_hash',
      status: 'detected',
    }, { onConflict: 'tenant_key,source_id,duplicate_of_source_id' })
  }
  return data
}

async function processMissionAcquisition(client: Awaited<ReturnType<typeof createServiceClient>>, job: any) {
  const missionId = String(job.payload?.missionId || job.entity_id)
  const { data: mission, error } = await table(client, 'research_missions').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId).single()
  if (error) throw error
  if (!['queued', 'approved', 'acquiring', 'failed'].includes(String(mission.status))) throw new Error(`Mission status ${mission.status} cannot be acquired.`)

  await table(client, 'research_missions').update({ status: 'acquiring', failure_reason: null, updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId)
  const queries = Array.isArray(mission.planned_queries) ? mission.planned_queries.map(String).filter(Boolean).slice(0, 12) : []
  let usedCredits = safeNumber(mission.used_credits)
  let sourceCount = 0
  for (let index = 0; index < queries.length; index += 1) {
    const query = queries[index]
    const estimatedCredits = mission.search_depth === 'advanced' ? 2 : 1
    if (usedCredits + estimatedCredits > safeNumber(mission.budget_credits, 10)) break
    const { data: queryRow, error: queryError } = await table(client, 'research_queries').upsert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      mission_id: missionId,
      query_text: query,
      query_order: index + 1,
      status: 'running',
      parameters: {
        searchDepth: mission.search_depth,
        includeDomains: mission.include_domains || [],
        excludeDomains: mission.exclude_domains || [],
        sourceLimit: mission.source_limit,
      },
      started_at: new Date().toISOString(),
    }, { onConflict: 'tenant_key,mission_id,query_order' }).select('*').single()
    if (queryError) throw queryError

    const run = await startRun(client, {
      taskProfile: 'tavily_search_acquisition',
      provider: 'tavily',
      entityType: 'research_mission',
      entityId: missionId,
      inputPayload: { query, missionCode: mission.code, searchDepth: mission.search_depth },
      actorId: job.created_by,
    })
    const startedAt = Date.now()
    try {
      const response = await tavilySearch({
        query,
        searchDepth: mission.search_depth,
        maxResults: Math.min(20, Math.max(1, safeNumber(mission.source_limit, 8))),
        includeDomains: Array.isArray(mission.include_domains) ? mission.include_domains : [],
        excludeDomains: Array.isArray(mission.exclude_domains) ? mission.exclude_domains : [],
        includeRawContent: mission.mode === 'deep_evidence' || mission.mode === 'known_source',
      })
      usedCredits += response.credits
      const persisted: any[] = []
      for (const result of response.results) {
        const source = await persistSearchSource(client, mission, result, response.requestId, String(queryRow.id))
        persisted.push(source)
        await enqueueJob(client, {
          idempotencyKey: `source-claims:${source.id}:${source.content_hash}`,
          jobType: 'source_claim_extraction',
          entityType: 'research_source',
          entityId: String(source.id),
          payload: { sourceId: source.id, missionId },
          priority: 55,
          actorId: job.created_by,
        })
      }
      sourceCount += persisted.length
      await completeRun(client, String(run.id), {
        output: { requestId: response.requestId, resultCount: response.results.length, credits: response.credits },
        latencyMs: Date.now() - startedAt,
        responseId: response.requestId,
      })
      await recordUsage(client, {
        provider: 'tavily',
        operation: 'search',
        runId: String(run.id),
        missionId,
        credits: response.credits,
      })
      await table(client, 'provider_calls').insert({
        tenant_key: INTELLIGENCE_TENANT_KEY,
        intelligence_run_id: run.id,
        provider: 'tavily',
        operation: 'search',
        provider_response_id: response.requestId,
        status: 'succeeded',
        latency_ms: Date.now() - startedAt,
        usage_payload: { credits: response.credits, resultCount: response.results.length },
      })
      await recordProviderHealth(client, { provider: 'tavily', status: 'success', operation: 'search', latencyMs: Date.now() - startedAt, metadata: { requestId: response.requestId } })
      await table(client, 'research_queries').update({
        status: 'completed',
        tavily_request_id: response.requestId,
        result_count: response.results.length,
        credits_used: response.credits,
        completed_at: new Date().toISOString(),
      }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', queryRow.id)
    } catch (providerError) {
      await failRun(client, String(run.id), providerError, Date.now() - startedAt)
      await recordProviderHealth(client, { provider: 'tavily', status: 'failure', operation: 'search', latencyMs: Date.now() - startedAt, errorMessage: providerError instanceof Error ? providerError.message : String(providerError) })
      await table(client, 'research_queries').update({
        status: 'failed',
        failure_reason: providerError instanceof Error ? providerError.message : String(providerError),
        completed_at: new Date().toISOString(),
      }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', queryRow.id)
      throw providerError
    }
  }

  const { count: actualCount } = await table(client, 'research_sources').select('id', { count: 'exact', head: true }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('mission_id', missionId)
  await table(client, 'research_missions').update({
    status: 'evidence_review',
    used_credits: usedCredits,
    source_count: actualCount || sourceCount,
    updated_at: new Date().toISOString(),
  }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId)
  return { missionId, sourceCount: actualCount || sourceCount, usedCredits }
}

async function processSourceClaimExtraction(client: Awaited<ReturnType<typeof createServiceClient>>, job: any) {
  const sourceId = String(job.payload?.sourceId || job.entity_id)
  const missionId = String(job.payload?.missionId || '')
  const [{ data: source, error: sourceError }, { data: mission, error: missionError }] = await Promise.all([
    table(client, 'research_sources').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', sourceId).single(),
    table(client, 'research_missions').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId).single(),
  ])
  if (sourceError) throw sourceError
  if (missionError) throw missionError
  const profile = await loadModelProfile('evidence_claim_extraction')
  const context = {
    mission: { code: mission.code, title: mission.title, question: mission.strategic_question, purpose: mission.purpose },
    source: { id: source.id, title: source.title, url: source.url, domain: source.domain, content: String(source.normalized_content || '').slice(0, 45_000) },
  }
  const run = await startRun(client, {
    taskProfile: profile.profileKey,
    provider: 'openrouter',
    entityType: 'research_source',
    entityId: sourceId,
    modelRequested: profile.primaryModel,
    inputPayload: context,
    actorId: job.created_by,
  })
  const startedAt = Date.now()
  try {
    const result = await openRouterStructuredCompletion({
      taskProfile: profile.profileKey,
      profile,
      messages: [
        {
          role: 'system',
          content: 'You are the evidence extraction function of ANGELCARE Flashcards OS. Extract only claims supported by the supplied source. Distinguish direct statements from inferences. Never create product materials, images, PDFs, videos, quotations or customer actions. Return only the required JSON schema.',
        },
        { role: 'user', content: JSON.stringify(context) },
      ],
      metadata: { mission_id: missionId, source_id: sourceId },
    })
    const claims = Array.isArray(result.data.claims) ? result.data.claims as Array<Record<string, unknown>> : []
    const assessment = result.data.sourceAssessment as Record<string, unknown> | undefined
    for (const claim of claims) {
      const { data: claimRow, error } = await table(client, 'evidence_claims').insert({
        tenant_key: INTELLIGENCE_TENANT_KEY,
        mission_id: missionId,
        statement: String(claim.statement || ''),
        claim_kind: String(claim.kind || 'fact'),
        supporting_extract: String(claim.supportingExtract || ''),
        confidence: safeNumber(claim.confidence),
        directness: String(claim.directness || 'direct'),
        contradiction_ids: [],
        contradiction_signals: Array.isArray(claim.contradictionSignals) ? claim.contradictionSignals : [],
        geographic_applicability: Array.isArray(claim.geographicApplicability) ? claim.geographicApplicability : [],
        age_applicability: Array.isArray(claim.ageApplicability) ? claim.ageApplicability : [],
        product_applicability: Array.isArray(claim.productApplicability) ? claim.productApplicability : [],
        review_status: 'pending',
        extraction_run_id: run.id,
      }).select('id').single()
      if (error) throw error
      const { error: linkError } = await table(client, 'claim_source_links').insert({
        tenant_key: INTELLIGENCE_TENANT_KEY,
        claim_id: claimRow.id,
        source_id: sourceId,
        relationship: 'supports',
      })
      if (linkError) throw linkError
    }
    const recommendation = String(assessment?.recommendedReview || 'needs_verification')
    await table(client, 'research_sources').update({
      authority_score: safeNumber(assessment?.authorityScore, source.authority_score),
      freshness_score: safeNumber(assessment?.freshnessScore, source.freshness_score),
      review_status: recommendation === 'accept' ? 'pending' : recommendation === 'reject' ? 'needs_verification' : 'needs_verification',
      ai_limitations: Array.isArray(assessment?.limitations) ? assessment?.limitations : [],
      updated_at: new Date().toISOString(),
    }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', sourceId)
    await recordOpenRouterResult(client, String(run.id), result, profile.profileKey, missionId)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'success', operation: profile.profileKey, latencyMs: Date.now() - startedAt, metadata: { model: result.modelUsed } })
    return { sourceId, claimCount: claims.length }
  } catch (providerError) {
    await failRun(client, String(run.id), providerError, Date.now() - startedAt)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'failure', operation: profile.profileKey, latencyMs: Date.now() - startedAt, errorMessage: providerError instanceof Error ? providerError.message : String(providerError) })
    throw providerError
  }
}

async function processResearchSynthesis(client: Awaited<ReturnType<typeof createServiceClient>>, job: any) {
  const missionId = String(job.payload?.missionId || job.entity_id)
  const [{ data: mission, error: missionError }, { data: sources, error: sourceError }, { data: claims, error: claimError }] = await Promise.all([
    table(client, 'research_missions').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId).single(),
    table(client, 'research_sources').select('id,title,url,domain,quality_score,normalized_content,review_status').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('mission_id', missionId).eq('review_status', 'accepted'),
    table(client, 'evidence_claims').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('mission_id', missionId).in('review_status', ['accepted', 'pending']),
  ])
  if (missionError) throw missionError
  if (sourceError) throw sourceError
  if (claimError) throw claimError
  if (!sources?.length) throw new Error('No accepted sources are available for synthesis.')
  await table(client, 'research_missions').update({ status: 'synthesising', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId)
  const profile = await loadModelProfile('external_research_synthesis')
  const context = {
    mission: { id: mission.id, code: mission.code, title: mission.title, strategicQuestion: mission.strategic_question, purpose: mission.purpose, geographicScope: mission.geographic_scope, audiences: mission.audience_profiles },
    approvedSources: sources.map((item: any) => ({ id: item.id, title: item.title, url: item.url, domain: item.domain, qualityScore: item.quality_score, content: String(item.normalized_content || '').slice(0, 12_000) })),
    claims: (claims || []).map((item: any) => ({ id: item.id, statement: item.statement, kind: item.claim_kind, extract: item.supporting_extract, confidence: item.confidence, reviewStatus: item.review_status, contradictionSignals: item.contradiction_signals })),
  }
  const run = await startRun(client, {
    taskProfile: profile.profileKey,
    provider: 'openrouter',
    entityType: 'research_mission',
    entityId: missionId,
    modelRequested: profile.primaryModel,
    inputPayload: context,
    actorId: job.created_by,
  })
  const startedAt = Date.now()
  try {
    const result = await openRouterStructuredCompletion({
      taskProfile: profile.profileKey,
      profile,
      messages: [
        {
          role: 'system',
          content: 'You are ANGELCARE Flashcards OS Research Synthesis. Use only the provided accepted sources and claims. Cite claim IDs in every finding. Distinguish source-derived facts, analytical inference, uncertainty and decisions still required. Do not create final creative assets or production commands. Return only the governed JSON schema.',
        },
        { role: 'user', content: JSON.stringify(context) },
      ],
      metadata: { mission_id: missionId },
    })
    const { count } = await table(client, 'research_syntheses').select('id', { count: 'exact', head: true }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('mission_id', missionId)
    const payload = result.data
    const { data: synthesis, error } = await table(client, 'research_syntheses').insert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      mission_id: missionId,
      version_no: (count || 0) + 1,
      status: 'review',
      executive_answer: String(payload.executiveAnswer || ''),
      findings: payload.findings || [],
      contradictions: payload.contradictions || [],
      limitations: payload.limitations || [],
      product_implications: payload.productImplications || [],
      risks: payload.risks || [],
      assumptions: payload.assumptions || [],
      remaining_gaps: payload.remainingGaps || [],
      recommended_next_action: String(payload.recommendedNextAction || ''),
      intelligence_run_id: run.id,
      model_used: result.modelUsed,
      created_by: job.created_by,
    }).select('*').single()
    if (error) throw error
    await table(client, 'research_missions').update({ status: 'human_review', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId)
    await recordOpenRouterResult(client, String(run.id), result, profile.profileKey, missionId)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'success', operation: profile.profileKey, latencyMs: Date.now() - startedAt, metadata: { model: result.modelUsed } })
    return { missionId, synthesisId: synthesis.id }
  } catch (providerError) {
    await failRun(client, String(run.id), providerError, Date.now() - startedAt)
    await table(client, 'research_missions').update({ status: 'failed', failure_reason: providerError instanceof Error ? providerError.message : String(providerError), updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'failure', operation: profile.profileKey, latencyMs: Date.now() - startedAt, errorMessage: providerError instanceof Error ? providerError.message : String(providerError) })
    throw providerError
  }
}

async function processOpportunityArchitecture(client: Awaited<ReturnType<typeof createServiceClient>>, job: any) {
  const missionId = String(job.payload?.missionId || job.entity_id)
  const [{ data: mission, error: missionError }, { data: synthesis, error: synthesisError }, { data: claims }] = await Promise.all([
    table(client, 'research_missions').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId).single(),
    table(client, 'research_syntheses').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('mission_id', missionId).in('status', ['approved', 'review']).order('version_no', { ascending: false }).limit(1).single(),
    table(client, 'evidence_claims').select('id,statement,claim_kind,confidence,review_status').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('mission_id', missionId).in('review_status', ['accepted', 'pending']),
  ])
  if (missionError) throw missionError
  if (synthesisError) throw synthesisError
  const profile = await loadModelProfile('product_opportunity_architect')
  const context = {
    mission: { code: mission.code, title: mission.title, question: mission.strategic_question, purpose: mission.purpose },
    synthesis: { executiveAnswer: synthesis.executive_answer, findings: synthesis.findings, productImplications: synthesis.product_implications, risks: synthesis.risks, remainingGaps: synthesis.remaining_gaps },
    claims: claims || [],
  }
  const run = await startRun(client, { taskProfile: profile.profileKey, provider: 'openrouter', entityType: 'research_mission', entityId: missionId, modelRequested: profile.primaryModel, inputPayload: context, actorId: job.created_by })
  const startedAt = Date.now()
  try {
    const result = await openRouterStructuredCompletion({
      taskProfile: profile.profileKey,
      profile,
      messages: [
        { role: 'system', content: 'You are ANGELCARE Flashcards OS Product Opportunity Architect. Transform the governed research synthesis into one precise opportunity hypothesis. Do not create product assets or final production commands. Return only the required JSON schema.' },
        { role: 'user', content: JSON.stringify(context) },
      ],
      metadata: { mission_id: missionId },
    })
    const output = result.data
    const opportunityCode = `OPP-${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}-${randomUUID().slice(0, 4).toUpperCase()}`
    const evidenceClaimIds = (claims || []).map((item: any) => String(item.id))
    const { data: opportunity, error } = await table(client, 'product_opportunities').insert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      code: opportunityCode,
      title: String(output.title || mission.title),
      thesis: String(output.thesis || ''),
      problem_statement: String(output.problemStatement || ''),
      target_audience: output.targetAudience || mission.audience_profiles || [],
      related_collection_ids: mission.collection_ids || [],
      related_mission_ids: [missionId],
      evidence_claim_ids: evidenceClaimIds,
      status: 'qualified',
      recommendation: String(output.recommendation || ''),
      missing_evidence: output.missingEvidence || [],
      owner_name: mission.owner_name,
      created_by: job.created_by,
    }).select('*').single()
    if (error) throw error
    const evidenceStrength = Math.min(100, Math.round((evidenceClaimIds.length / 12) * 100))
    await table(client, 'opportunity_scores').insert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      opportunity_id: opportunity.id,
      evidence_strength: evidenceStrength,
      strategic_fit: 78,
      portfolio_gap: 76,
      audience_value: 80,
      learning_value: 84,
      language_relevance: 72,
      age_coverage: 68,
      context_coverage: 75,
      differentiation: 70,
      format_reuse: 80,
      bundle_potential: 78,
      journey_potential: 82,
      commercial_potential: 72,
      production_complexity: 55,
      content_risk: 38,
      cultural_risk: 34,
      rights_risk: 30,
      overlap_risk: 42,
      readiness_to_design: Math.min(85, evidenceStrength + 20),
      weighted_total: Math.round((evidenceStrength + 78 + 76 + 80 + 84 + 72 + 68 + 75 + 70 + 80 + 78 + 82 + 72 + 45 + 62 + 66 + 70 + 58 + Math.min(85, evidenceStrength + 20)) / 19),
      score_version: 'UMZ2-1.0',
      score_explanation: { deterministic: true, source: 'mission_architecture_defaults', runId: run.id },
    })
    await recordOpenRouterResult(client, String(run.id), result, profile.profileKey, missionId)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'success', operation: profile.profileKey, latencyMs: Date.now() - startedAt, metadata: { model: result.modelUsed } })
    return { missionId, opportunityId: opportunity.id }
  } catch (providerError) {
    await failRun(client, String(run.id), providerError, Date.now() - startedAt)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'failure', operation: profile.profileKey, latencyMs: Date.now() - startedAt, errorMessage: providerError instanceof Error ? providerError.message : String(providerError) })
    throw providerError
  }
}

async function processProductDesignArchitecture(client: Awaited<ReturnType<typeof createServiceClient>>, job: any) {
  const designId = String(job.payload?.designId || job.entity_id)
  const [{ data: design, error: designError }, { data: opportunity, error: opportunityError }] = await Promise.all([
    table(client, 'product_designs').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId).single(),
    table(client, 'product_opportunities').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', String(job.payload?.opportunityId || '')).single(),
  ])
  if (designError) throw designError
  if (opportunityError) throw opportunityError
  const claimIds = Array.isArray(design.evidence_claim_ids) ? design.evidence_claim_ids : []
  const { data: claims } = claimIds.length
    ? await table(client, 'evidence_claims').select('*').eq('tenant_key', INTELLIGENCE_TENANT_KEY).in('id', claimIds)
    : { data: [] }
  const profile = await loadModelProfile('product_concept_designer')
  const context = {
    opportunity: {
      code: opportunity.code,
      title: opportunity.title,
      thesis: opportunity.thesis,
      problemStatement: opportunity.problem_statement,
      targetAudience: opportunity.target_audience,
      recommendation: opportunity.recommendation,
      missingEvidence: opportunity.missing_evidence,
    },
    designSeed: { code: design.code, title: design.title, executiveThesis: design.executive_thesis, problemDefinition: design.problem_definition },
    evidenceClaims: (claims || []).map((item: any) => ({ id: item.id, statement: item.statement, kind: item.claim_kind, confidence: item.confidence, reviewStatus: item.review_status })),
    doctrine: {
      boundary: 'Product design only. No final PDF, MP4, classroom asset, image, artwork or external production command is allowed in UMZ2.',
      handoff: 'The result must be a governed product design dossier ready for later UMZ3 command compilation after human approval.',
    },
  }
  const run = await startRun(client, { taskProfile: profile.profileKey, provider: 'openrouter', entityType: 'product_design', entityId: designId, modelRequested: profile.primaryModel, inputPayload: context, actorId: job.created_by })
  const startedAt = Date.now()
  try {
    const result = await openRouterStructuredCompletion({
      taskProfile: profile.profileKey,
      profile,
      messages: [
        { role: 'system', content: 'You are ANGELCARE Flashcards OS Product Concept Designer. Architect the complete product dossier from evidence and internal product truth. Compare alternatives and expose risks. Do not generate any creative asset, PDF, MP4, classroom file, image, artwork or final external production command. Return only the governed JSON schema.' },
        { role: 'user', content: JSON.stringify(context) },
      ],
      metadata: { design_id: designId, opportunity_id: opportunity.id },
    })
    const output = result.data
    const cardArchitecture = Array.isArray(output.cardArchitecture) ? output.cardArchitecture : []
    const alternatives = Array.isArray(output.alternatives) ? output.alternatives as Array<Record<string, unknown>> : []
    const readiness = Math.min(92, 45 + Math.min(25, claimIds.length * 3) + (cardArchitecture.length ? 15 : 0) + (alternatives.length >= 2 ? 7 : 0))
    const { data: updated, error } = await table(client, 'product_designs').update({
      status: 'review',
      executive_thesis: String(output.executiveThesis || design.executive_thesis),
      problem_definition: String(output.problemDefinition || design.problem_definition),
      target_markets: output.targetMarkets || [],
      learner_profiles: output.learnerProfiles || [],
      age_ranges: output.ageRanges || [],
      usage_contexts: output.usageContexts || [],
      pain_points: output.painPoints || [],
      desired_outcomes: output.desiredOutcomes || [],
      educational_doctrine: output.educationalDoctrine || [],
      primary_objective: String(output.primaryObjective || ''),
      secondary_objectives: output.secondaryObjectives || [],
      content_perimeter: output.contentPerimeter || [],
      card_architecture: cardArchitecture,
      total_card_count_hypothesis: safeNumber(output.totalCardCountHypothesis),
      progression_model: output.progressionModel || [],
      language_strategy: output.languageStrategy || [],
      inclusion_requirements: output.inclusionRequirements || [],
      cultural_adaptation: output.culturalAdaptation || [],
      format_strategy: output.formatStrategy || [],
      overlap_analysis: output.overlapAnalysis || [],
      differentiation: output.differentiation || [],
      bundle_compatibility: output.bundleCompatibility || [],
      journey_compatibility: output.journeyCompatibility || [],
      commercial_hypothesis: output.commercialHypothesis || [],
      production_complexity: output.productionComplexity || [],
      rights_and_safety_risks: output.rightsAndSafetyRisks || [],
      open_questions: output.openQuestions || [],
      readiness_score: readiness,
      architecture_run_id: run.id,
      updated_at: new Date().toISOString(),
    }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId).select('*').single()
    if (error) throw error
    await table(client, 'design_alternatives').delete().eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('design_id', designId)
    if (alternatives.length) {
      const { error: alternativeError } = await table(client, 'design_alternatives').insert(alternatives.map((item, index) => ({
        tenant_key: INTELLIGENCE_TENANT_KEY,
        design_id: designId,
        sort_order: index + 1,
        name: String(item.name || `Alternative ${index + 1}`),
        thesis: String(item.thesis || ''),
        benefits: item.benefits || [],
        drawbacks: item.drawbacks || [],
        card_count_hypothesis: safeNumber(item.cardCountHypothesis),
        formats: item.formats || [],
        audience_fit: safeNumber(item.audienceFit),
        differentiation: safeNumber(item.differentiation),
        complexity: safeNumber(item.complexity),
        risk: safeNumber(item.risk),
        recommendation: String(item.recommendation || ''),
        source_run_id: run.id,
      })))
      if (alternativeError) throw alternativeError
    }
    await table(client, 'product_design_versions').insert({
      tenant_key: INTELLIGENCE_TENANT_KEY,
      design_id: designId,
      version_no: safeNumber(updated.version_no, 1),
      status: 'review',
      change_summary: 'Architecture Product Design produite par OpenRouter sous contrôle UMZ2.',
      design_snapshot: updated,
      intelligence_run_id: run.id,
      created_by: job.created_by,
    })
    await recordOpenRouterResult(client, String(run.id), result, profile.profileKey, null)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'success', operation: profile.profileKey, latencyMs: Date.now() - startedAt, metadata: { model: result.modelUsed } })
    return { designId, readiness, alternativeCount: alternatives.length }
  } catch (providerError) {
    await failRun(client, String(run.id), providerError, Date.now() - startedAt)
    await table(client, 'product_designs').update({ status: 'rework', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId)
    await recordProviderHealth(client, { provider: 'openrouter', status: 'failure', operation: profile.profileKey, latencyMs: Date.now() - startedAt, errorMessage: providerError instanceof Error ? providerError.message : String(providerError) })
    throw providerError
  }
}

async function claimNextJob(client: Awaited<ReturnType<typeof createServiceClient>>, workerId: string) {
  const { data, error } = await client.rpc('fc_os_claim_intelligence_job', { worker_id_input: workerId })
  if (error) throw error
  if (!data) return null
  if (Array.isArray(data)) return data[0] || null
  return data
}

async function recordJobAuditOutbox(client: Awaited<ReturnType<typeof createServiceClient>>, input: {
  jobId: string
  jobType: string
  status: 'succeeded' | 'failed' | 'blocked' | 'dead_letter' | 'queued'
  summary: string
  payload?: Record<string, unknown>
}) {
  await table(client, 'audit_events').insert({
    actor_id: 'flashcards-os-intelligence-worker',
    actor_name: 'Flashcards OS Intelligence Worker',
    action_key: `intelligence.job.${input.status}`,
    action_label: `Intelligence job ${input.status}`,
    entity_type: 'intelligence_job',
    entity_id: input.jobId,
    summary: input.summary,
    after_payload: { jobType: input.jobType, status: input.status, ...(input.payload || {}) },
    risk_level: input.status === 'failed' || input.status === 'blocked' || input.status === 'dead_letter' ? 'high' : 'normal',
  })
  await table(client, 'outbox_events').insert({
    event_key: `intelligence.job.${input.status}`,
    aggregate_type: 'intelligence_job',
    aggregate_id: input.jobId,
    payload: { jobType: input.jobType, status: input.status, ...(input.payload || {}) },
    status: 'pending',
  })
}

async function completeJob(client: Awaited<ReturnType<typeof createServiceClient>>, job: any, result: unknown) {
  const { error } = await table(client, 'intelligence_jobs').update({
    status: 'succeeded',
    result,
    completed_at: new Date().toISOString(),
    locked_at: null,
    locked_by: null,
    updated_at: new Date().toISOString(),
  }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', String(job.id))
  if (error) throw error
  await recordJobAuditOutbox(client, { jobId: String(job.id), jobType: String(job.job_type), status: 'succeeded', summary: `Job ${String(job.job_type)} completed under governed worker.`, payload: { resultHash: hash(result) } })
}

async function failJob(client: Awaited<ReturnType<typeof createServiceClient>>, job: any, error: unknown) {
  const attempts = safeNumber(job.attempts, 1)
  const maxAttempts = safeNumber(job.max_attempts, 3)
  const dead = attempts >= maxAttempts
  const delaySeconds = Math.min(3600, Math.pow(2, Math.max(0, attempts - 1)) * 30)
  const availableAt = new Date(Date.now() + delaySeconds * 1000).toISOString()
  const message = error instanceof Error ? error.message : String(error)
  const typed = error as Error & { code?: string }
  const blocked = typed.code === 'FLASHCARDS_INTELLIGENCE_PRIVACY_BLOCK'
  await table(client, 'intelligence_jobs').update({
    status: blocked ? 'blocked' : dead ? 'dead_letter' : 'queued',
    last_error: message,
    error_code: typed.code || 'JOB_EXECUTION_ERROR',
    available_at: blocked || dead ? job.available_at : availableAt,
    completed_at: blocked || dead ? new Date().toISOString() : null,
    locked_at: null,
    locked_by: null,
    updated_at: new Date().toISOString(),
  }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', job.id)
  const terminalStatus = blocked ? 'blocked' : dead ? 'dead_letter' : 'queued'
  await recordJobAuditOutbox(client, { jobId: String(job.id), jobType: String(job.job_type), status: terminalStatus, summary: `Job ${String(job.job_type)} ${terminalStatus}: ${message.slice(0, 240)}`, payload: { attempts, maxAttempts, errorCode: typed.code || 'JOB_EXECUTION_ERROR' } })
}

export async function processNextIntelligenceJob(workerId = `flashcards-worker-${process.pid}`) {
  const client = await createServiceClient()
  const job = await claimNextJob(client, workerId)
  if (!job) return { processed: false, reason: 'queue_empty' }
  try {
    let result: unknown
    if (job.job_type === 'mission_acquisition') result = await processMissionAcquisition(client, job)
    else if (job.job_type === 'source_claim_extraction') result = await processSourceClaimExtraction(client, job)
    else if (job.job_type === 'research_synthesis') result = await processResearchSynthesis(client, job)
    else if (job.job_type === 'opportunity_architecture') result = await processOpportunityArchitecture(client, job)
    else if (job.job_type === 'product_design_architecture') result = await processProductDesignArchitecture(client, job)
    else throw new Error(`Unsupported intelligence job type: ${job.job_type}`)
    await completeJob(client, job, result)
    return { processed: true, jobId: String(job.id), jobType: String(job.job_type), result }
  } catch (error) {
    await failJob(client, job, error)
    return {
      processed: true,
      jobId: String(job.id),
      jobType: String(job.job_type),
      failed: true,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function queueOpportunityFromMission(missionId: string, actor: ActorContext) {
  const client = await createServiceClient()
  const { data: mission, error } = await table(client, 'research_missions').select('id,code,status').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', missionId).single()
  if (error) throw error
  if (!['human_review', 'completed'].includes(String(mission.status))) throw new Error('Research synthesis must be ready for human review or completed before opportunity architecture.')
  const job = await enqueueJob(client, {
    idempotencyKey: `opportunity-architecture:${missionId}`,
    jobType: 'opportunity_architecture',
    entityType: 'research_mission',
    entityId: missionId,
    payload: { missionId },
    priority: 80,
    actorId: actor.id,
  })
  return { jobId: String(job.id), status: String(job.status), missionCode: String(mission.code) }
}

export async function queueProductDesignArchitecture(designId: string, actor: ActorContext) {
  const client = await createServiceClient()
  const { data: design, error } = await table(client, 'product_designs').select('id,code,status,opportunity_id').eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId).single()
  if (error) throw error
  if (!['draft', 'rework', 'structuring'].includes(String(design.status))) throw new Error('Only draft, rework or structuring designs can be architected.')
  const { error: updateError } = await table(client, 'product_designs').update({ status: 'structuring', updated_at: new Date().toISOString() }).eq('tenant_key', INTELLIGENCE_TENANT_KEY).eq('id', designId)
  if (updateError) throw updateError
  const job = await enqueueJob(client, {
    idempotencyKey: `product-design-architecture:${designId}:v1`,
    jobType: 'product_design_architecture',
    entityType: 'product_design',
    entityId: designId,
    payload: { designId, opportunityId: design.opportunity_id },
    priority: 85,
    actorId: actor.id,
  })
  return { jobId: String(job.id), status: String(job.status), designCode: String(design.code) }
}

export function actorFromUser(user: any): ActorContext {
  return {
    id: String(user?.id || user?.user_id || 'unknown'),
    name: String(user?.full_name || user?.name || user?.email || 'Utilisateur ANGELCARE'),
    role: String(user?.role || user?.role_key || 'user'),
  }
}

export async function testIntelligenceProviderConnection(provider: 'tavily' | 'openrouter', actor: ActorContext) {
  const client = await createServiceClient()
  const entityId = randomUUID()
  const run = await startRun(client, {
    taskProfile: provider === 'tavily' ? 'tavily_connection_test' : 'openrouter_free_connection_test',
    provider,
    entityType: 'provider_connection_test',
    entityId,
    modelRequested: provider === 'openrouter' ? 'openrouter/free' : null,
    inputPayload: { provider, explicitUserTest: true },
    actorId: actor.id,
  })
  const startedAt = Date.now()
  try {
    if (provider === 'tavily') {
      const result = await tavilySearch({
        query: 'ANGELCARE Flashcards OS provider connectivity verification',
        searchDepth: 'basic',
        maxResults: 1,
        includeRawContent: false,
      })
      await completeRun(client, String(run.id), {
        output: { requestId: result.requestId, resultCount: result.results.length, credits: result.credits },
        latencyMs: Date.now() - startedAt,
        responseId: result.requestId,
      })
      await recordUsage(client, { provider: 'tavily', operation: 'connection_test', runId: String(run.id), credits: result.credits })
      await recordProviderHealth(client, { provider: 'tavily', status: 'success', operation: 'connection_test', latencyMs: Date.now() - startedAt, metadata: { requestId: result.requestId, resultCount: result.results.length } })
      await recordJobAuditOutbox(client, { jobId: entityId, jobType: 'provider_connection_test', status: 'succeeded', summary: 'Tavily Free connection test completed visibly.', payload: { provider: 'tavily', requestId: result.requestId } })
      return { provider: 'tavily' as const, status: 'success' as const, requestId: result.requestId, resultCount: result.results.length, credits: result.credits, latencyMs: Date.now() - startedAt }
    }

    const result = await openRouterFreeCompletion({
      taskProfile: 'openrouter_free_connection_test',
      messages: [
        { role: 'system', content: 'You are performing a transparent connectivity test. Reply with exactly ANGELCARE_OPENROUTER_FREE_OK and nothing else.' },
        { role: 'user', content: 'Confirm the OpenRouter free route is operational.' },
      ],
      temperature: 0,
      maxOutputTokens: 32,
      timeoutMs: intelligenceEnvironment().openrouter.timeoutMs,
      retryLimit: 0,
      metadata: { explicit_user_test: 'true' },
    })
    await completeRun(client, String(run.id), {
      modelUsed: result.actualModel,
      fallbackUsed: false,
      providerName: result.providerName,
      output: { response: result.rawContent.slice(0, 200), requestedRoute: result.requestedRoute, actualModel: result.actualModel },
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      costUsd: result.providerReportedCostUsd,
      latencyMs: result.latencyMs,
      responseId: result.responseId,
    })
    await recordUsage(client, { provider: 'openrouter', operation: 'connection_test', runId: String(run.id), promptTokens: result.promptTokens, completionTokens: result.completionTokens, totalTokens: result.totalTokens, costUsd: result.providerReportedCostUsd, model: result.actualModel })
    await recordProviderHealth(client, { provider: 'openrouter', status: 'success', operation: 'connection_test', latencyMs: result.latencyMs, metadata: { requestedRoute: result.requestedRoute, actualModel: result.actualModel, responseId: result.responseId } })
    await recordJobAuditOutbox(client, { jobId: entityId, jobType: 'provider_connection_test', status: 'succeeded', summary: 'OpenRouter Free connection test completed visibly.', payload: { provider: 'openrouter', requestedRoute: result.requestedRoute, actualModel: result.actualModel } })
    return { provider: 'openrouter' as const, status: 'success' as const, requestedRoute: result.requestedRoute, actualModel: result.actualModel, providerName: result.providerName, responseId: result.responseId, latencyMs: result.latencyMs, totalTokens: result.totalTokens, providerReportedCostUsd: result.providerReportedCostUsd }
  } catch (error) {
    await failRun(client, String(run.id), error, Date.now() - startedAt)
    await recordProviderHealth(client, { provider, status: 'failure', operation: 'connection_test', latencyMs: Date.now() - startedAt, errorMessage: error instanceof Error ? error.message : String(error), metadata: { explicitUserTest: true } })
    await recordJobAuditOutbox(client, { jobId: entityId, jobType: 'provider_connection_test', status: 'failed', summary: `${provider} connection test failed visibly.`, payload: { provider, error: error instanceof Error ? error.message : String(error) } })
    throw error
  }
}
