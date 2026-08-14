import type { RevenueContext, RevenueDecision } from './types'

const normalize = (value: unknown) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const HIGH_RISK_TERMS = [
  'urgence medicale','emergency','suicide','violence','abus','abuse','danger','police','avocat','lawyer',
  'hospitalisation','hospitalization','medicament','medication','diagnostic','diagnosis','traitement medical',
  'allergie grave','severe allergy','convulsion','seizure','respire pas','not breathing',
]

const VULNERABLE_CONTEXT_TERMS = [
  'postpartum','apres accouchement','après accouchement','nouveau-ne','nouveau né','newborn','special needs',
  'besoins speciaux','besoins spéciaux','handicap','autisme','autism','trisomie','down syndrome',
]

export function riskGate(context: RevenueContext, text: string) {
  const corpus = normalize(`${text} ${context.latestInboundText}`)
  const highRisk = HIGH_RISK_TERMS.filter(term => corpus.includes(normalize(term)))
  const vulnerable = VULNERABLE_CONTEXT_TERMS.filter(term => corpus.includes(normalize(term)))
  return {
    highRisk,
    vulnerable,
    blocksAutonomy: highRisk.length > 0,
    requiresCarefulTone: vulnerable.length > 0,
  }
}

export function sanitizeCommercialIntensity(value: unknown, cap = 5) {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return 2
  return Math.max(0, Math.min(Math.max(0, Math.min(6, cap)), Math.round(numeric)))
}

export function eligibilityForDecision(input: {
  confidence: number
  mode: string
  globalMode: string
  threshold: number
  paused: boolean
  excluded: boolean
  risk: ReturnType<typeof riskGate>
  accountReady: boolean
}) {
  if (input.paused || input.excluded || input.mode === 'protected') return { eligibility: 'red' as const, reason: 'HUMAN_OR_PROTECTED' }
  if (!input.accountReady) return { eligibility: 'amber' as const, reason: 'ACCOUNT_NOT_READY' }
  if (input.risk.blocksAutonomy) return { eligibility: 'red' as const, reason: 'HIGH_RISK_CONTEXT' }
  if (input.confidence < Math.max(.25, input.threshold - .18)) return { eligibility: 'blue' as const, reason: 'LOW_CONFIDENCE_ASSIST_ONLY' }
  const explicitAuto = ['selected_auto','account_auto'].includes(input.mode)
  const fleetAuto = ['controlled','no_shift','overflow','campaign','full'].includes(input.globalMode)
  if ((explicitAuto || fleetAuto) && input.confidence >= input.threshold) return { eligibility: 'green' as const, reason: explicitAuto ? 'EXPLICIT_AUTONOMY' : 'FLEET_AUTONOMY' }
  return { eligibility: 'blue' as const, reason: 'ASSISTED_MODE' }
}

export function enforceDecisionSafety(decision: RevenueDecision, context: RevenueContext) {
  const risk = riskGate(context, decision.responseText || '')
  if (risk.blocksAutonomy) {
    return {
      ...decision,
      action: 'handoff' as const,
      responseText: null,
      eligibility: 'red' as const,
      risk: { ...decision.risk, ...risk, reason: 'HIGH_RISK_CONTEXT' },
    }
  }
  return { ...decision, risk: { ...decision.risk, ...risk } }
}
