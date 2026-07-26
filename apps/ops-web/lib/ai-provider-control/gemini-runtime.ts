import { GoogleGenAI, ThinkingLevel } from '@google/genai'

export type GeminiThinkingLevel = 'LOW' | 'MEDIUM' | 'HIGH'

type GeminiProviderInvocation = {
  apiKey: string
  model: string
  contents: string
  systemInstruction?: string
  responseMimeType?: string
  responseJsonSchema?: unknown
  maxOutputTokens?: number
  thinkingLevel?: GeminiThinkingLevel
  abortSignal?: AbortSignal
}

const thinking = (level: GeminiThinkingLevel | undefined) => {
  if (level === 'HIGH') return ThinkingLevel.HIGH
  if (level === 'MEDIUM') return ThinkingLevel.MEDIUM
  return ThinkingLevel.LOW
}

/**
 * Provider-specific execution boundary.
 * Credentials are supplied only by AI Provider Control after a governed reservation.
 * This function never reads environment keys and never decides eligibility, quotas or reuse.
 */
export async function invokeGeminiProvider(input: GeminiProviderInvocation) {
  if (!input.apiKey) throw new Error('AI_PROVIDER_GOVERNED_CREDENTIAL_REQUIRED')
  return new GoogleGenAI({ apiKey: input.apiKey }).models.generateContent({
    model: input.model,
    contents: input.contents,
    config: {
      ...(input.systemInstruction ? { systemInstruction: input.systemInstruction } : {}),
      ...(input.responseMimeType ? { responseMimeType: input.responseMimeType } : {}),
      ...(input.responseJsonSchema ? { responseJsonSchema: input.responseJsonSchema as never } : {}),
      ...(input.maxOutputTokens ? { maxOutputTokens: input.maxOutputTokens } : {}),
      thinkingConfig: { thinkingLevel: thinking(input.thinkingLevel) },
      ...(input.abortSignal ? { abortSignal: input.abortSignal } : {}),
    },
  })
}
