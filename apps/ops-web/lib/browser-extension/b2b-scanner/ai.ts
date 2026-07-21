import type { ScannerFact, ScannerOpportunityHypothesis, ScannerSignal } from './types'

type AiResult = {
  configured: boolean
  used: boolean
  provider: string | null
  model: string | null
  warning?: string | null
  summary?: string | null
  opportunityHypotheses?: ScannerOpportunityHypothesis[]
  missingInformation?: string[]
}

function env(name: string) {
  return String(process.env[name] || '').trim()
}

function safeJson(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || value
  const first = fenced.indexOf('{')
  const last = fenced.lastIndexOf('}')
  if (first < 0 || last <= first) throw new Error('SCANNER_AI_INVALID_JSON')
  return JSON.parse(fenced.slice(first, last + 1))
}

export async function runConfiguredScannerAI(input: {
  organization: Record<string, unknown>
  facts: ScannerFact[]
  signals: ScannerSignal[]
  services: string[]
  vertical: Record<string, any>
}): Promise<AiResult> {
  const endpoint = env('BROWSER_SCANNER_AI_ENDPOINT')
  const apiKey = env('BROWSER_SCANNER_AI_API_KEY')
  const model = env('BROWSER_SCANNER_AI_MODEL')
  if (!endpoint || !apiKey || !model) return { configured: false, used: false, provider: null, model: null, warning: 'GOVERNED_AI_NOT_CONFIGURED' }

  const evidence = input.facts.slice(0, 120).map((fact, index) => ({
    evidenceId: `E${index + 1}`,
    fieldKey: fact.fieldKey,
    value: fact.value,
    sourceUrl: fact.sourceUrl,
    confidence: fact.confidence,
  }))
  const signalEvidence = input.signals.slice(0, 40).map((signal, index) => ({
    evidenceId: `S${index + 1}`,
    type: signal.signalType,
    label: signal.label,
    evidence: signal.evidence,
    sourceUrl: signal.sourceUrl,
  }))
  const system = [
    'You are ANGELCARE Revenue Intelligence Scanner reasoning service.',
    'Use only the evidence supplied. Never invent a person, fact, email, revenue, branch, customer, contract, or operational capability.',
    'Clearly separate evidence-backed inference from missing information.',
    'Return strict JSON only with keys summary, opportunityHypotheses, missingInformation.',
    'Each opportunity hypothesis must cite evidenceIds, include confidence from 0 to 1, a practical pricingModel, and missingInformation.',
    'Do not recommend unrestricted scraping or automated external communication.',
  ].join(' ')
  const user = JSON.stringify({ organization: input.organization, vertical: input.vertical, services: input.services, evidence, signals: signalEvidence })

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(25_000),
    })
    if (!response.ok) return { configured: true, used: false, provider: new URL(endpoint).hostname, model, warning: `SCANNER_AI_HTTP_${response.status}` }
    const payload: any = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content) return { configured: true, used: false, provider: new URL(endpoint).hostname, model, warning: 'SCANNER_AI_EMPTY_RESPONSE' }
    const parsed = safeJson(String(content))
    const hypotheses: ScannerOpportunityHypothesis[] = Array.isArray(parsed.opportunityHypotheses)
      ? parsed.opportunityHypotheses.slice(0, 8).map((item: any) => ({
          programKey: String(item.programKey || 'custom_opportunity').slice(0, 120),
          title: String(item.title || 'Opportunity hypothesis').slice(0, 240),
          rationale: String(item.rationale || '').slice(0, 1600),
          evidence: Array.isArray(item.evidenceIds) ? item.evidenceIds.map(String).slice(0, 20) : [],
          potentialModel: String(item.pricingModel || 'Pilot puis contrat récurrent').slice(0, 300),
          confidence: Math.max(0, Math.min(1, Number(item.confidence || 0.5))),
          missingInformation: Array.isArray(item.missingInformation) ? item.missingInformation.map(String).slice(0, 20) : [],
          estimatedAnnualValueMin: 0,
          estimatedAnnualValueMax: 0,
        }))
      : []
    return {
      configured: true,
      used: true,
      provider: new URL(endpoint).hostname,
      model,
      summary: String(parsed.summary || '').slice(0, 2500),
      opportunityHypotheses: hypotheses,
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation.map(String).slice(0, 30) : [],
    }
  } catch (error) {
    return { configured: true, used: false, provider: (() => { try { return new URL(endpoint).hostname } catch { return 'configured-provider' } })(), model, warning: error instanceof Error ? error.message : 'SCANNER_AI_FAILED' }
  }
}
