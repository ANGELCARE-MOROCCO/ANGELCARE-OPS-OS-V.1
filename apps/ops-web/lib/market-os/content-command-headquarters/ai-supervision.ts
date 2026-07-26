import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { createServiceClient } from '@/lib/supabase/server'
import { acquireGovernedProvider, failGovernedProvider, reconcileGovernedProvider } from '@/lib/ai-provider-control/governor'
import { uploadContentHeadquartersFile } from './bridge'
import { auditContentHeadquarters } from './repository'
import type { JsonRecord } from './types'

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['result', 'score', 'summary', 'findings', 'corrections', 'humanDecisionRequired'],
  properties: {
    result: { type: 'string', enum: ['pass', 'pass_minor_corrections', 'revision_required', 'out_of_scope', 'human_decision_required', 'blocked'] },
    score: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dimension', 'title', 'severity', 'observation'],
        properties: {
          dimension: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'minor', 'major', 'critical'] },
          observation: { type: 'string' },
          evidence: { type: 'string' },
        },
      },
    },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['issue', 'requiredCorrection', 'evidenceRequired'],
        properties: {
          issue: { type: 'string' },
          requiredCorrection: { type: 'string' },
          evidenceRequired: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        },
      },
    },
    humanDecisionRequired: { type: 'boolean' },
  },
} as const

function usageFrom(response: unknown) {
  const usage = (response as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }).usageMetadata
  return { inputTokens: Number(usage?.promptTokenCount || 0), outputTokens: Number(usage?.candidatesTokenCount || 0) }
}

function extractJson(text: string) {
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(clean) as Record<string, unknown>
}

export async function analyzeProgressEvidence(input: {
  actorId: string
  actorName: string
  dossierId: string
  evidenceId: string
  filename: string
  contentType: string
  bytes: Uint8Array
  dossierContext: JsonRecord
  rubric: JsonRecord
}) {
  const requestedModel = String(process.env.MARKETING_AI_VISION_MODEL || process.env.MARKETING_AI_PRIMARY_MODEL || process.env.GEMINI_PRIMARY_MODEL || 'gemini-3.5-flash')
  const acquisition = await acquireGovernedProvider({
    moduleKey: 'marketing_ai',
    capability: 'content_visual_review',
    requestedModel,
    estimatedRequests: 1,
    estimatedOutputTokens: 4096,
    actorId: input.actorId,
    missionId: input.dossierId,
    commandCode: 'CONTENT-EVIDENCE-REVIEW',
  })
  const apiKey = acquisition.apiKey || process.env.GEMINI_API_KEY || ''
  if (!apiKey) throw new Error('GEMINI_API_KEY_MISSING')
  const ai = new GoogleGenAI({ apiKey })
  const started = Date.now()
  try {
    const response = await ai.models.generateContent({
      model: acquisition.model || requestedModel,
      contents: [{
        role: 'user',
        parts: [
          { text: JSON.stringify({
            mission: 'Review this ANGELCARE content-production progress evidence. Enforce the dossier scope. Evaluate visual hierarchy, contrast, typography, spacing, alignment, logo treatment, service truth, message clarity, CTA, audience relevance, privacy, child dignity, Moroccan market context and the supplied acceptance rubric. Return precise corrections. Never fabricate a fact that is not visible or supplied.',
            dossier: input.dossierContext,
            rubric: input.rubric,
            outputLanguage: 'French',
          }) },
          { inlineData: { mimeType: input.contentType || 'image/png', data: Buffer.from(input.bytes).toString('base64') } },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: REVIEW_SCHEMA,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      },
    })
    if (!response.text) throw new Error('AI_REVIEW_EMPTY_OUTPUT')
    const parsed = extractJson(response.text)
    const usage = usageFrom(response)
    const supabase = await createServiceClient() as any
    const insert = await supabase.from('market_content_ai_reviews').insert({
      dossier_id: input.dossierId,
      evidence_id: input.evidenceId,
      result: String(parsed.result || 'human_decision_required'),
      score: Number(parsed.score || 0),
      summary: String(parsed.summary || ''),
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
      rubric: input.rubric,
      model_code: acquisition.model || requestedModel,
      provider_dossier_id: acquisition.dossierId,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      latency_ms: Date.now() - started,
      reviewer_id: input.actorId || null,
      reviewer_name: `${input.actorName} · AI supervised`,
    }).select('*').single()
    if (insert.error) throw insert.error
    await supabase.from('market_content_evidence').update({ status: 'reviewed' }).eq('id', input.evidenceId)
    await reconcileGovernedProvider(acquisition, { requestCount: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, latencyMs: Date.now() - started, httpStatus: 200, outcome: 'completed', actorId: input.actorId, missionId: input.dossierId, commandCode: 'CONTENT-EVIDENCE-REVIEW', metadata: { evidenceId: input.evidenceId, result: parsed.result } })
    await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'evidence.ai_reviewed', entityType: 'content_ai_review', entityId: insert.data.id, detail: { dossierId: input.dossierId, evidenceId: input.evidenceId, result: parsed.result, score: parsed.score } })
    return insert.data
  } catch (error) {
    await failGovernedProvider(acquisition, error, { latencyMs: Date.now() - started, actorId: input.actorId, missionId: input.dossierId, commandCode: 'CONTENT-EVIDENCE-REVIEW' })
    throw error
  }
}

function extractFirstImage(response: unknown) {
  const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; text?: string }> } }> }).candidates || []
  for (const candidate of candidates) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.data) return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' }
    }
  }
  return null
}

export async function generateDossierSample(input: {
  actorId: string
  actorName: string
  dossierId: string
  missionId?: string | null
  purpose: string
  direction: string
  format: string
  message: string
  constraints: string[]
  dossierContext: JsonRecord
}) {
  const supabase = await createServiceClient() as any
  const reserve = await supabase.rpc('market_content_reserve_generation_credit', {
    p_dossier_id: input.dossierId,
    p_mission_id: input.missionId || null,
    p_actor_id: input.actorId || null,
    p_actor_name: input.actorName,
  })
  if (reserve.error) throw reserve.error
  const reservation = Array.isArray(reserve.data) ? reserve.data[0] : reserve.data
  const creditId = String(reservation?.credit_id || '')
  const creditNumber = Number(reservation?.credit_number || 0)
  if (!creditId || !creditNumber) throw new Error('GENERATION_CREDIT_RESERVATION_FAILED')

  const requestedModel = String(process.env.MARKETING_AI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview')
  const acquisition = await acquireGovernedProvider({
    moduleKey: 'marketing_ai',
    capability: 'image_generation',
    requestedModel,
    estimatedRequests: 1,
    estimatedOutputTokens: 2048,
    actorId: input.actorId,
    missionId: input.missionId || input.dossierId,
    commandCode: 'CONTENT-SAMPLE-IMAGE',
  })
  const apiKey = acquisition.apiKey || process.env.GEMINI_API_KEY || ''
  if (!apiKey) {
    await supabase.rpc('market_content_release_generation_credit', { p_credit_id: creditId, p_reason: 'GEMINI_API_KEY_MISSING' })
    throw new Error('GEMINI_API_KEY_MISSING')
  }
  const ai = new GoogleGenAI({ apiKey })
  const prompt = [
    'Create one premium visual-direction sample for ANGELCARE. This is a concept reference, not a final public asset.',
    `Purpose: ${input.purpose}`,
    `Visual direction: ${input.direction}`,
    `Requested format: ${input.format}`,
    `Required message: ${input.message}`,
    `Constraints: ${input.constraints.join('; ')}`,
    `Dossier context: ${JSON.stringify(input.dossierContext)}`,
    'Brand doctrine: premium Moroccan childcare and family-services authority; clear visual hierarchy; correct contrast; respectful representation of children and families; no fabricated prices, certifications, medical claims, contact details or legal promises; no logo invention. Leave a clean reserved brand zone when the official logo is not supplied.',
  ].join('\n')
  const started = Date.now()
  try {
    const response = await ai.models.generateContent({
      model: acquisition.model || requestedModel,
      contents: prompt,
      config: { responseModalities: ['TEXT', 'IMAGE'] as any },
    })
    const image = extractFirstImage(response)
    if (!image) throw new Error('IMAGE_GENERATION_NO_IMAGE')
    const bytes = new Uint8Array(Buffer.from(image.data, 'base64'))
    const filename = `AI_CONCEPT_${input.dossierId}_${creditNumber}.${image.mimeType.includes('jpeg') ? 'jpg' : 'png'}`
    const uploaded = await uploadContentHeadquartersFile({
      actorId: input.actorId,
      entityType: 'content_ai_concept_sample',
      entityId: input.dossierId,
      filename,
      contentType: image.mimeType,
      bytes,
      metadata: { missionId: input.missionId || null, creditNumber, conceptReferenceOnly: true },
    })
    const insert = await supabase.from('market_content_generated_samples').insert({
      dossier_id: input.dossierId,
      mission_id: input.missionId || null,
      credit_id: creditId,
      credit_number: creditNumber,
      prompt,
      model_code: acquisition.model || requestedModel,
      provider_dossier_id: acquisition.dossierId,
      bridge_file_id: uploaded.bridgeFileId,
      storage_key: uploaded.storageKey,
      content_type: uploaded.contentType,
      filename: uploaded.originalFilename,
      size_bytes: uploaded.sizeBytes,
      sha256_hash: uploaded.sha256Hash,
      preview_data_url: null,
      status: 'generated',
      generated_by: input.actorId || null,
      generated_by_name: input.actorName,
    }).select('*').single()
    if (insert.error) throw insert.error
    await supabase.rpc('market_content_commit_generation_credit', { p_credit_id: creditId, p_sample_id: insert.data.id })
    const usage = usageFrom(response)
    await reconcileGovernedProvider(acquisition, { requestCount: 1, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, latencyMs: Date.now() - started, httpStatus: 200, outcome: 'completed', actorId: input.actorId, missionId: input.missionId || input.dossierId, commandCode: 'CONTENT-SAMPLE-IMAGE', metadata: { creditId, creditNumber, sampleId: insert.data.id } })
    await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'sample.generated', entityType: 'content_generated_sample', entityId: insert.data.id, detail: { dossierId: input.dossierId, creditNumber, model: acquisition.model || requestedModel } })
    return insert.data
  } catch (error) {
    await supabase.rpc('market_content_release_generation_credit', { p_credit_id: creditId, p_reason: error instanceof Error ? error.message : String(error) })
    await failGovernedProvider(acquisition, error, { latencyMs: Date.now() - started, actorId: input.actorId, missionId: input.missionId || input.dossierId, commandCode: 'CONTENT-SAMPLE-IMAGE' })
    throw error
  }
}
