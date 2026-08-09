import { invokeGeminiProvider } from './gemini-runtime'

const clean = (value: unknown) => String(value ?? '').trim()

export type ProviderHealthResult = {
  providerType: string
  modelVersion: string
  responseId: string | null
  text: string
  inputTokens: number
  outputTokens: number
  details: Record<string, unknown>
}

export async function invokeProviderHealth(input: { providerType: string; apiKey: string; model: string }): Promise<ProviderHealthResult> {
  const provider = clean(input.providerType).toLowerCase()
  if (/openrouter/.test(provider)) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${input.apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'SANILA Provider Control' },
      body: JSON.stringify({ model: input.model, messages: [{ role: 'user', content: 'Return exactly SANILA_PROVIDER_OK' }], max_tokens: 32, temperature: 0 }),
      cache: 'no-store',
    })
    const json = await response.json().catch(() => ({})) as Record<string, any>
    if (!response.ok) throw new Error(`OPENROUTER_HEALTH_${response.status}:${clean(json?.error?.message || json?.message)}`)
    const text = clean(json?.choices?.[0]?.message?.content)
    if (!text.includes('SANILA_PROVIDER_OK')) throw new Error('OPENROUTER_HEALTH_UNEXPECTED_OUTPUT')
    return { providerType: 'openrouter', modelVersion: clean(json.model || input.model), responseId: clean(json.id) || null, text, inputTokens: Number(json?.usage?.prompt_tokens || 0), outputTokens: Number(json?.usage?.completion_tokens || 0), details: { finishReason: json?.choices?.[0]?.finish_reason || null } }
  }
  if (/tavily/.test(provider)) {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${input.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'SANILA provider connectivity health check', search_depth: 'basic', max_results: 1, include_answer: false }),
      cache: 'no-store',
    })
    const json = await response.json().catch(() => ({})) as Record<string, any>
    if (!response.ok) throw new Error(`TAVILY_HEALTH_${response.status}:${clean(json?.detail || json?.message)}`)
    const count = Array.isArray(json.results) ? json.results.length : 0
    return { providerType: 'tavily', modelVersion: input.model || 'tavily-search', responseId: clean(json.request_id) || null, text: 'SANILA_PROVIDER_OK', inputTokens: 0, outputTokens: 0, details: { resultCount: count, responseTime: json.response_time || null } }
  }
  if (/gemini|google/.test(provider)) {
    const response = await invokeGeminiProvider({ apiKey: input.apiKey, model: input.model, contents: 'Return the health token SANILA_PROVIDER_OK.', systemInstruction: 'This is a provider connectivity health check. Return only SANILA_PROVIDER_OK.', maxOutputTokens: 256, thinkingLevel: /^gemini-3(?:\.|$)/i.test(input.model) ? 'MINIMAL' : undefined })
    const text = clean(response.text)
    if (!text.includes('SANILA_PROVIDER_OK')) throw new Error('GEMINI_HEALTH_UNEXPECTED_OUTPUT')
    const usage = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined
    return { providerType: 'gemini', modelVersion: clean(response.modelVersion || input.model), responseId: clean(response.responseId) || null, text, inputTokens: Number(usage?.promptTokenCount || 0), outputTokens: Number(usage?.candidatesTokenCount || 0), details: { finishReason: response.candidates?.[0]?.finishReason || null, legacyCompatibility: true } }
  }
  throw new Error(`PROVIDER_HEALTH_UNSUPPORTED:${provider || 'unknown'}`)
}
