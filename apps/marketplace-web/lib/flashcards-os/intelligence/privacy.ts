import 'server-only'

import { createHash } from 'node:crypto'

export type RedactionFinding = {
  category: 'email' | 'phone' | 'secret' | 'identity' | 'financial_document' | 'learner_data'
  count: number
  blocked: boolean
  description: string
}

export type RedactionResult = {
  safeText: string
  findings: RedactionFinding[]
  blocked: boolean
  sourceHash: string
  safeHash: string
}

const rules: Array<{
  category: RedactionFinding['category']
  pattern: RegExp
  replacement: string
  blocked: boolean
  description: string
}> = [
  {
    category: 'email',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[EMAIL_REDACTED]',
    blocked: false,
    description: 'Adresse e-mail supprimée du contexte transmis.',
  },
  {
    category: 'phone',
    pattern: /(?:\+?\d[\d\s().-]{7,}\d)/g,
    replacement: '[PHONE_REDACTED]',
    blocked: false,
    description: 'Numéro de téléphone supprimé du contexte transmis.',
  },
  {
    category: 'secret',
    pattern: /\b(?:sk-[A-Za-z0-9_-]{12,}|tvly-[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
    replacement: '[SECRET_BLOCKED]',
    blocked: true,
    description: 'Clé, jeton ou secret détecté; transmission bloquée.',
  },
  {
    category: 'financial_document',
    pattern: /\b(?:invoice|facture|devis|bon de livraison)\s*(?:n[°o]?|#|:)\s*[A-Z0-9/_-]{3,}\b/gi,
    replacement: '[FINANCIAL_DOCUMENT_REFERENCE_REDACTED]',
    blocked: false,
    description: 'Référence commerciale sensible supprimée.',
  },
  {
    category: 'learner_data',
    pattern: /\b(?:learner|élève|enfant)\s*(?:name|nom)?\s*[:=-]\s*[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÿ' -]{2,}/gi,
    replacement: '[LEARNER_IDENTITY_REDACTED]',
    blocked: true,
    description: 'Identité potentielle d’un apprenant détectée; transmission bloquée.',
  },
]

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function redactIntelligenceContext(input: string): RedactionResult {
  let safeText = input
  const findings: RedactionFinding[] = []

  for (const rule of rules) {
    let count = 0
    safeText = safeText.replace(rule.pattern, () => {
      count += 1
      return rule.replacement
    })
    if (count) findings.push({ category: rule.category, count, blocked: rule.blocked, description: rule.description })
  }

  return {
    safeText,
    findings,
    blocked: findings.some((item) => item.blocked),
    sourceHash: hash(input),
    safeHash: hash(safeText),
  }
}

export function assertSafeForExternalProvider(input: string) {
  const result = redactIntelligenceContext(input)
  if (result.blocked) {
    const reasons = result.findings.filter((item) => item.blocked).map((item) => item.description).join(' ')
    const error = new Error(`Intelligence context blocked by AngelCare privacy firewall. ${reasons}`)
    ;(error as Error & { code?: string; redaction?: RedactionResult }).code = 'FLASHCARDS_INTELLIGENCE_PRIVACY_BLOCK'
    ;(error as Error & { code?: string; redaction?: RedactionResult }).redaction = result
    throw error
  }
  return result
}

export function minimalContext<T extends Record<string, unknown>>(source: T, allowedFields: Array<keyof T>) {
  return Object.fromEntries(allowedFields.filter((key) => source[key] !== undefined).map((key) => [String(key), source[key]]))
}
