export type GovernedFinding = {
  classification: 'evidence_backed_inference' | 'commercial_hypothesis' | 'missing_information'
  title: string
  rationale: string
  evidenceIds: string[]
  confidence: number
  nextAction?: string | null
}

export type GovernedAIResult = {
  configured: boolean
  used: boolean
  mode: 'governed_ai' | 'rules_fallback'
  provider: string | null
  model: string | null
  warning: string | null
  policyVersion: string
  dataClass: string
  retention: 'no_provider_retention_requested' | 'provider_policy_applies'
  summary: string
  findings: GovernedFinding[]
}

const POLICY_VERSION = 'angelcare-governed-revenue-ai-v2.0'
const env = (key: string) => String(process.env[key] || '').trim()
const truthy = (value: string) => ['1','true','yes','on','enabled'].includes(value.toLowerCase())
const falsy = (value: string) => ['0','false','no','off','disabled'].includes(value.toLowerCase())

function fallback(input: { rulesFallback: GovernedFinding[]; dataClass?: string }, warning: string, configured = false, provider: string | null = null, model: string | null = null): GovernedAIResult {
  return {
    configured,
    used: false,
    mode: 'rules_fallback',
    provider,
    model,
    warning,
    policyVersion: POLICY_VERSION,
    dataClass: input.dataClass || 'public_business',
    retention: 'no_provider_retention_requested',
    summary: configured ? 'Le fournisseur IA gouverné n’est pas disponible ou sa réponse a été rejetée. Le moteur de règles explicable reste actif.' : 'Moteur de règles explicable actif. IA gouvernée indisponible.',
    findings: input.rulesFallback,
  }
}

function parseJson(value: string) {
  const body = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || value
  const first = body.indexOf('{')
  const last = body.lastIndexOf('}')
  if (first < 0 || last <= first) throw new Error('ULTRA_AI_INVALID_JSON')
  return JSON.parse(body.slice(first, last + 1))
}

function boundedFinding(item: any, evidenceIds: Set<string>): GovernedFinding | null {
  const cited = Array.isArray(item?.evidenceIds) ? item.evidenceIds.map(String).filter((id: string) => evidenceIds.has(id)).slice(0, 20) : []
  const classification = ['evidence_backed_inference','commercial_hypothesis','missing_information'].includes(String(item?.classification))
    ? item.classification
    : cited.length ? 'evidence_backed_inference' : 'commercial_hypothesis'
  if (classification !== 'missing_information' && !cited.length) return null
  const title = String(item?.title || '').trim().slice(0, 240)
  const rationale = String(item?.rationale || '').trim().slice(0, 2000)
  if (!title || !rationale) return null
  return {
    classification,
    title,
    rationale,
    evidenceIds: cited,
    confidence: Math.max(0, Math.min(1, Number(item?.confidence || 0.5))),
    nextAction: item?.nextAction ? String(item.nextAction).slice(0, 500) : null,
  }
}

function providerIdentity(endpoint: string) {
  try { return new URL(endpoint).hostname } catch { return 'configured-provider' }
}

function endpointAllowed(endpoint: string) {
  try {
    const url = new URL(endpoint)
    if (url.protocol === 'https:') return true
    return process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost','127.0.0.1','::1'].includes(url.hostname)
  } catch { return false }
}

export async function runGovernedRevenueAI(input: {
  objective: string
  account: Record<string, unknown>
  doctrine: Record<string, unknown>
  evidence: Array<{ id: string; type: string; value: string; sourceUrl?: string | null; confidence?: number | null; validationStatus?: string | null }>
  rulesFallback: GovernedFinding[]
  dataClass?: 'public_business' | 'internal_commercial' | 'restricted_financial'
}): Promise<GovernedAIResult> {
  const endpoint = env('BROWSER_REVENUE_AI_ENDPOINT') || env('BROWSER_SCANNER_AI_ENDPOINT')
  const apiKey = env('BROWSER_REVENUE_AI_API_KEY') || env('BROWSER_SCANNER_AI_API_KEY')
  const model = env('BROWSER_REVENUE_AI_MODEL') || env('BROWSER_SCANNER_AI_MODEL')
  const enabledRaw = env('BROWSER_REVENUE_AI_ENABLED')
  const killSwitch = truthy(env('BROWSER_REVENUE_AI_KILL_SWITCH'))
  const enabled = enabledRaw ? !falsy(enabledRaw) : false
  const dataClass = input.dataClass || 'public_business'
  const allowedClasses = new Set((env('BROWSER_REVENUE_AI_ALLOWED_DATA_CLASSES') || 'public_business,internal_commercial').split(',').map((value) => value.trim()).filter(Boolean))
  const provider = endpoint ? providerIdentity(endpoint) : null
  if (killSwitch) return fallback(input, 'GOVERNED_AI_KILL_SWITCH_ACTIVE', Boolean(endpoint && apiKey && model), provider, model || null)
  if (!enabled) return fallback(input, 'GOVERNED_AI_FEATURE_DISABLED', Boolean(endpoint && apiKey && model), provider, model || null)
  if (!endpoint || !apiKey || !model) return fallback(input, 'GOVERNED_AI_NOT_CONFIGURED')
  if (!endpointAllowed(endpoint)) return fallback(input, 'GOVERNED_AI_ENDPOINT_NOT_ALLOWED', true, provider, model)
  if (!allowedClasses.has(dataClass)) return fallback(input, 'GOVERNED_AI_DATA_CLASS_BLOCKED', true, provider, model)

  const evidence = input.evidence.slice(0, Math.max(1, Math.min(Number(env('BROWSER_REVENUE_AI_MAX_EVIDENCE') || 100), 200)))
  const evidenceIds = new Set(evidence.map((row) => row.id))
  const system = [
    `Policy ${POLICY_VERSION}. You are the governed ANGELCARE Revenue Director reasoning provider.`,
    'Use only supplied evidence. Never invent organizations, people, emails, payments, signatures, contracts, delivery, client commitments or verified facts.',
    'Every non-missing finding must cite at least one supplied evidence ID.',
    'Separate evidence-backed inference, commercial hypothesis and missing information.',
    'Do not authorize external communication, discounts, contracts, payment verification, won state, partner launch, renewal approval or tender submission.',
    'Return strict JSON: {summary,findings:[{classification,title,rationale,evidenceIds,confidence,nextAction}]}.',
  ].join(' ')
  const requestPayload = {
    objective: String(input.objective || '').slice(0, 1000),
    account: input.account,
    doctrine: input.doctrine,
    evidence,
    dataClass,
    policyVersion: POLICY_VERSION,
  }
  const maxRequestChars = Math.max(10_000, Math.min(Number(env('BROWSER_REVENUE_AI_MAX_REQUEST_CHARS') || 80_000), 250_000))
  const serialized = JSON.stringify(requestPayload)
  if (serialized.length > maxRequestChars) return fallback(input, 'GOVERNED_AI_CONTEXT_LIMIT_EXCEEDED', true, provider, model)
  const timeoutMs = Math.max(3_000, Math.min(Number(env('BROWSER_REVENUE_AI_TIMEOUT_MS') || 30_000), 60_000))
  const maxTokens = Math.max(256, Math.min(Number(env('BROWSER_REVENUE_AI_MAX_OUTPUT_TOKENS') || 1600), 4000))
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}`, 'x-angelcare-policy-version': POLICY_VERSION, 'x-angelcare-data-class': dataClass },
      body: JSON.stringify({ model, temperature: 0.1, max_tokens: maxTokens, store: false, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: serialized }] }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return fallback(input, `ULTRA_AI_HTTP_${response.status}`, true, provider, model)
    const payload: any = await response.json()
    const content = payload?.choices?.[0]?.message?.content ?? payload?.output_text ?? payload?.content
    if (!content) return fallback(input, 'ULTRA_AI_EMPTY_RESPONSE', true, provider, model)
    const parsed = parseJson(String(content))
    const findings = (Array.isArray(parsed?.findings) ? parsed.findings : []).map((row: any) => boundedFinding(row, evidenceIds)).filter(Boolean).slice(0, 12) as GovernedFinding[]
    if (!findings.length) return fallback(input, 'ULTRA_AI_EVIDENCE_BINDING_FAILED', true, provider, model)
    return {
      configured: true,
      used: true,
      mode: 'governed_ai',
      provider,
      model,
      warning: null,
      policyVersion: POLICY_VERSION,
      dataClass,
      retention: 'no_provider_retention_requested',
      summary: String(parsed?.summary || '').slice(0, 2500),
      findings,
    }
  } catch (error) {
    return fallback(input, error instanceof Error ? error.message : 'ULTRA_AI_FAILED', true, provider, model)
  }
}
