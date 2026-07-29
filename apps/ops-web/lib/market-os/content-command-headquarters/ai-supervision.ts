import { createServiceClient } from '@/lib/supabase/server'
import { executeImageGeneration, executeMultimodalAnalysis } from '@/lib/market-os/ai-runtime/gateway'
import { uploadContentHeadquartersFile } from './bridge'
import { auditContentHeadquarters } from './repository'
import type { JsonRecord } from './types'

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['result', 'score', 'summary', 'findings', 'corrections', 'humanDecisionRequired'],
  properties: {
    result: { type: 'string', enum: ['pass', 'pass_minor_corrections', 'revision_required', 'out_of_scope', 'human_decision_required', 'blocked'] },
    score: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dimension', 'title', 'severity', 'observation'], properties: { dimension: { type: 'string' }, title: { type: 'string' }, severity: { type: 'string', enum: ['info', 'minor', 'major', 'critical'] }, observation: { type: 'string' }, evidence: { type: 'string' } } } },
    corrections: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['issue', 'requiredCorrection', 'evidenceRequired'], properties: { issue: { type: 'string' }, requiredCorrection: { type: 'string' }, evidenceRequired: { type: 'string' }, priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } } } },
    humanDecisionRequired: { type: 'boolean' },
  },
} as const

function runtimeMode(context: JsonRecord) {
  const runtime = context.runtimeContinuity && typeof context.runtimeContinuity === 'object' ? context.runtimeContinuity as JsonRecord : {}
  const value = String(runtime.mode || 'auto')
  return ['auto','provider_only','without_research','manual'].includes(value) ? value as 'auto'|'provider_only'|'without_research'|'manual' : 'auto'
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
  const started = Date.now()
  const result = await executeMultimodalAnalysis<JsonRecord>({
    context: { actorId: input.actorId, missionId: input.dossierId, commandCode: 'CONTENT-EVIDENCE-REVIEW', continuationMode: runtimeMode(input.dossierContext) },
    instruction: JSON.stringify({
      mission: 'Inspect this Content Command Center production evidence against the exact dossier scope, approved brief, doctrine, channel, audience, version and supplied rubric. Evaluate only applicable criteria. Identify what is correct, what is missing, what must change, which evidence is required and how the workflow can continue. Every blocker must include a resolution, authorized override or manual continuation path. Do not invent any fact that is not visible or supplied.',
      dossier: input.dossierContext,
      rubric: input.rubric,
      filename: input.filename,
      outputLanguage: 'French',
    }),
    bytes: input.bytes,
    contentType: input.contentType || 'image/png',
    schema: REVIEW_SCHEMA as unknown as JsonRecord,
    schemaName: 'sanila_content_evidence_review',
    maxOutputTokens: 4096,
  })
  const supabase = await createServiceClient() as any
  const parsed = result.result || {
    result: 'human_decision_required',
    score: 0,
    summary: 'Inspection IA indisponible. La preuve reste accessible et le dossier continue vers une revue humaine, un autre fournisseur ou une nouvelle tentative.',
    findings: result.warnings.map((warning) => ({ dimension: 'runtime', title: 'Continuité provider', severity: 'info', observation: warning, evidence: input.filename })),
    corrections: [{ issue: 'Inspection IA non produite', requiredCorrection: 'Choisir inspection humaine, autre modèle ou nouvelle tentative.', evidenceRequired: 'Décision humaine ou résultat provider compatible', priority: 'medium' }],
    humanDecisionRequired: true,
  }
  const insert = await supabase.from('market_content_ai_reviews').insert({
    dossier_id: input.dossierId,
    evidence_id: input.evidenceId,
    result: String(parsed.result || 'human_decision_required'),
    score: Number(parsed.score || 0),
    summary: String(parsed.summary || ''),
    findings: Array.isArray(parsed.findings) ? parsed.findings : [],
    corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
    rubric: input.rubric,
    model_code: result.model || 'manual-continuity',
    provider_dossier_id: null,
    input_tokens: result.usage.inputTokens,
    output_tokens: result.usage.outputTokens,
    latency_ms: result.usage.latencyMs || Date.now() - started,
    reviewer_id: input.actorId || null,
    reviewer_name: result.status === 'completed' ? `${input.actorName} · AI supervised` : `${input.actorName} · revue humaine requise`,
  }).select('*').single()
  if (insert.error) throw insert.error
  await supabase.from('market_content_evidence').update({ status: result.status === 'completed' ? 'reviewed' : 'submitted' }).eq('id', input.evidenceId)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: result.status === 'completed' ? 'evidence.ai_reviewed' : 'evidence.ai_review_deferred', entityType: 'content_ai_review', entityId: insert.data.id, detail: { dossierId: input.dossierId, evidenceId: input.evidenceId, result: parsed.result, score: parsed.score, provider: result.providerType, model: result.model, alternatives: result.alternatives } })
  return { ...insert.data, runtimeContinuation: { status: result.status, warnings: result.warnings, alternatives: result.alternatives } }
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
  const reserve = await supabase.rpc('market_content_reserve_generation_credit', { p_dossier_id: input.dossierId, p_mission_id: input.missionId || null, p_actor_id: input.actorId || null, p_actor_name: input.actorName })
  if (reserve.error) throw reserve.error
  const reservation = Array.isArray(reserve.data) ? reserve.data[0] : reserve.data
  const creditId = String(reservation?.credit_id || '')
  const creditNumber = Number(reservation?.credit_number || 0)
  if (!creditId || !creditNumber) throw new Error('GENERATION_CREDIT_RESERVATION_FAILED')

  const prompt = [
    'Create one premium visual-direction sample for ANGELCARE Content Command Center. This is a concept reference, not a final public asset.',
    `Purpose: ${input.purpose}`,
    `Visual direction: ${input.direction}`,
    `Requested format: ${input.format}`,
    `Required message: ${input.message}`,
    `Constraints: ${input.constraints.join('; ')}`,
    `Dossier context: ${JSON.stringify(input.dossierContext)}`,
    'Respect the exact dossier, approved brief, audience, channel, format, brand doctrine and source truth. Do not invent logos, prices, certifications, claims, contacts or approvals. Preserve a clean official-brand zone when the logo file is not supplied.',
  ].join('\n')
  const generated = await executeImageGeneration({ context: { actorId: input.actorId, missionId: input.missionId || input.dossierId, commandCode: 'CONTENT-SAMPLE-IMAGE', continuationMode: runtimeMode(input.dossierContext) }, prompt, aspectRatio: input.format.includes('portrait') ? '4:5' : input.format.includes('story') ? '9:16' : input.format.includes('landscape') ? '16:9' : '1:1', quality: 'high', outputFormat: 'png' })

  if (generated.status !== 'completed' || !generated.image) {
    await supabase.rpc('market_content_release_generation_credit', { p_credit_id: creditId, p_reason: 'MANUAL_CONTINUITY_SELECTED' })
    await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'sample.manual_continuity', entityType: 'content_generated_sample', entityId: input.dossierId, detail: { dossierId: input.dossierId, creditNumber, warnings: generated.warnings, alternatives: generated.alternatives } })
    return {
      status: 'manual_required',
      dossier_id: input.dossierId,
      credit_number: creditNumber,
      prompt,
      warnings: generated.warnings,
      alternatives: [
        ...generated.alternatives,
        { code: 'upload_existing_asset', label: 'Joindre un asset existant' },
        { code: 'create_human_task', label: 'Créer une tâche créative humaine' },
      ],
    }
  }

  const filename = `AI_CONCEPT_${input.dossierId}_${creditNumber}.${generated.image.contentType.includes('jpeg') ? 'jpg' : generated.image.contentType.includes('webp') ? 'webp' : 'png'}`
  const uploaded = await uploadContentHeadquartersFile({ actorId: input.actorId, entityType: 'content_ai_concept_sample', entityId: input.dossierId, filename, contentType: generated.image.contentType, bytes: generated.image.bytes, metadata: { missionId: input.missionId || null, creditNumber, conceptReferenceOnly: true, provider: generated.providerType, model: generated.model } })
  const insert = await supabase.from('market_content_generated_samples').insert({
    dossier_id: input.dossierId, mission_id: input.missionId || null, credit_id: creditId, credit_number: creditNumber,
    prompt, model_code: generated.model || 'openrouter-image', provider_dossier_id: null,
    bridge_file_id: uploaded.bridgeFileId, storage_key: uploaded.storageKey, content_type: uploaded.contentType,
    filename: uploaded.originalFilename, size_bytes: uploaded.sizeBytes, sha256_hash: uploaded.sha256Hash,
    preview_data_url: null, status: 'generated', generated_by: input.actorId || null, generated_by_name: input.actorName,
  }).select('*').single()
  if (insert.error) throw insert.error
  await supabase.rpc('market_content_commit_generation_credit', { p_credit_id: creditId, p_sample_id: insert.data.id })
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: 'sample.generated', entityType: 'content_generated_sample', entityId: insert.data.id, detail: { dossierId: input.dossierId, creditNumber, provider: generated.providerType, model: generated.model } })
  return insert.data
}
