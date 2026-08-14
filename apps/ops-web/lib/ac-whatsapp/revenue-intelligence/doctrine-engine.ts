import type { DoctrineNode, DoctrinePack, RevenueContext, RevenueDecision } from './types'
import { sanitizeCommercialIntensity, riskGate } from './policy'

const normalize = (value: unknown) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const words = (value: unknown) => new Set(normalize(value).split(/[^a-z0-9à-ÿ_]+/i).filter(Boolean))
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const asArray = <T>(value: T[] | null | undefined): T[] => Array.isArray(value) ? value : []

function overlapScore(haystack: Set<string>, needles: string[]) {
  if (!needles.length) return 0
  let hit = 0
  for (const needle of needles) {
    const tokens = [...words(needle)]
    if (tokens.length && tokens.every(token => haystack.has(token))) hit += 1
  }
  return hit / needles.length
}

function nodeMatch(node: DoctrineNode, context: RevenueContext) {
  if (node.status !== 'active') return { score: 0, reasons: ['NODE_INACTIVE'] }
  const reasons: string[] = []
  let score = .08
  const textWords = words(`${context.latestInboundText} ${context.source} ${context.contact?.tags?.join?.(' ') || ''}`)
  const customerType = normalize(node.customer_type)
  if (!customerType || customerType === 'all' || customerType === normalize(context.customerType)) { score += .14; reasons.push('CUSTOMER_TYPE') }
  else score -= .12
  const serviceLine = normalize(node.service_line)
  if (!serviceLine || serviceLine === 'all' || serviceLine === normalize(context.serviceLine) || normalize(context.serviceLine) === 'general') { score += .14; reasons.push('SERVICE_LINE') }
  else score -= .08
  const stage = normalize(node.journey_stage)
  if (!stage || stage === 'all' || stage === normalize(context.journeyStage)) { score += .12; reasons.push('JOURNEY_STAGE') }
  const intent = normalize(node.intent_family)
  if (!intent || intent === 'all' || intent === normalize(context.intentFamily)) { score += .2; reasons.push('INTENT') }
  const triggers = asArray(node.trigger_terms).map(normalize).filter(Boolean)
  const triggerScore = overlapScore(textWords, triggers)
  if (triggerScore > 0) { score += triggerScore * .25; reasons.push(`TRIGGER_${Math.round(triggerScore*100)}`) }
  if (node.trigger_regex) {
    try { if (new RegExp(node.trigger_regex, 'i').test(context.latestInboundText)) { score += .2; reasons.push('REGEX') } } catch {}
  }
  score += Math.min(.1, Math.max(0, Number(node.priority || 0)) / 1000)
  score += Math.min(.08, Math.max(0, Number(node.maturity_weight || 0)) * .08)
  return { score: clamp(score), reasons }
}

export function rankDoctrineNodes(packs: DoctrinePack[], context: RevenueContext) {
  const ranked: Array<{ pack: DoctrinePack; node: DoctrineNode; score: number; reasons: string[] }> = []
  for (const pack of packs) {
    if (!['active','validated'].includes(String(pack.status))) continue
    const packCustomer = normalize(pack.customer_type)
    const packService = normalize(pack.service_line)
    const packCustomerFit = !packCustomer || packCustomer === 'all' || packCustomer === normalize(context.customerType)
    const packServiceFit = !packService || packService === 'all' || packService === normalize(context.serviceLine) || normalize(context.serviceLine) === 'general'
    if (!packCustomerFit || !packServiceFit) continue
    for (const node of asArray(pack.nodes)) {
      const matched = nodeMatch(node, context)
      if (matched.score >= .18) ranked.push({ pack, node, score: matched.score, reasons: matched.reasons })
    }
  }
  return ranked.sort((a,b) => b.score - a.score || Number(b.node.priority || 0) - Number(a.node.priority || 0))
}

function deterministicChoice<T>(rows: T[], seed: string): T | undefined {
  if (!rows.length) return undefined
  let hash = 2166136261
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return rows[Math.abs(hash) % rows.length]
}

function firstName(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.split(/\s+/)[0]
}

const acknowledgementBanks: Record<string,string[]> = {
  warm: [
    'Merci pour votre message.',
    'Merci, je comprends bien votre demande.',
    'Avec plaisir — regardons cela ensemble.',
    'Merci pour ces précisions.',
  ],
  executive: [
    'Merci pour votre retour.',
    'Très bien, je situe mieux votre besoin.',
    'Merci — votre contexte est clair.',
    'Parfait, avançons de façon concrète.',
  ],
  reassuring: [
    'Merci de nous avoir expliqué la situation.',
    'Je comprends, et nous allons avancer avec soin.',
    'Merci pour votre confiance.',
    'Je comprends votre préoccupation.',
  ],
}

function toneKey(node?: DoctrineNode) {
  const tone = normalize((node?.tone_profile as any)?.primary || (node?.tone_profile as any)?.tone || '')
  if (tone.includes('reassur') || tone.includes('care') || tone.includes('gentle')) return 'reassuring'
  if (tone.includes('b2b') || tone.includes('execut') || tone.includes('commercial')) return 'executive'
  return 'warm'
}

function unansweredQuestion(node: DoctrineNode | undefined, context: RevenueContext) {
  const questions = asArray(node?.qualification_questions)
  if (!questions.length) return null
  const corpus = normalize(context.messages.map(m => `${m.body || ''} ${m.caption || ''}`).join(' '))
  return questions.find(question => {
    const keyTokens = [...words(question)].filter(token => token.length > 4).slice(0,3)
    return !keyTokens.length || !keyTokens.every(token => corpus.includes(token))
  }) || null
}

function composeFromNode(node: DoctrineNode | undefined, context: RevenueContext, goal: string) {
  if (!node) return null
  const variants = asArray(node.response_variants).filter(Boolean)
  const selectedVariant = deterministicChoice(variants, `${context.conversation?.id}:${context.messages.length}:${goal}`)
  const guidance = String(selectedVariant || node.response_guidance || '').trim()
  const name = firstName(context.contact?.display_name)
  const acknowledgement = deterministicChoice(acknowledgementBanks[toneKey(node)], `${context.conversation?.id}:ack:${context.messages.length}`) || 'Merci pour votre message.'
  const question = unansweredQuestion(node, context)

  const variables: Record<string,string> = {
    first_name: name,
    contact_name: String(context.contact?.display_name || context.contact?.phone_number_e164 || ''),
    organization: String(context.contact?.organization_name || ''),
    city: String(context.contact?.city || ''),
    service_line: context.serviceLine,
    journey_stage: context.journeyStage,
    goal,
  }
  const rendered = guidance.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_,key) => variables[String(key).toLowerCase()] || '')
  const startsWithGreeting = /^(bonjour|bonsoir|salut|hello|merci)/i.test(rendered)
  const body = [startsWithGreeting ? '' : acknowledgement, rendered, question].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()
  return body || null
}

function defaultGoal(context: RevenueContext) {
  if (context.intentFamily === 'complaint_recovery') return 'recover_relationship'
  if (context.intentFamily === 'pricing') return context.scores.buyingIntent > .6 ? 'advance_to_commitment' : 'build_value_before_price'
  if (context.intentFamily === 'closing_signal') return 'secure_next_commitment'
  if (context.journeyStage === 'aware' || context.journeyStage === 'curious') return 'qualify_need'
  if (context.customerType === 'b2b' && context.scores.authority < .55) return 'discover_stakeholder'
  return 'advance_commercial_journey'
}

function actionFor(context: RevenueContext, node?: DoctrineNode) : RevenueDecision['action'] {
  const nodeAction = normalize(node?.action_type)
  if (['reply','suggest','wait','handoff','qualify','close','followup','protect'].includes(nodeAction)) return nodeAction as RevenueDecision['action']
  if (context.intentFamily === 'complaint_recovery') return 'protect'
  if (context.intentFamily === 'closing_signal') return 'close'
  if (context.journeyStage === 'aware' || context.journeyStage === 'curious') return 'qualify'
  return 'reply'
}

export function decideRevenueAction(input: { packs: DoctrinePack[]; context: RevenueContext; commercialIntensityCap?: number }) : RevenueDecision {
  const ranked = rankDoctrineNodes(input.packs, input.context)
  const best = ranked[0]
  const second = ranked[1]
  const matchConfidence = best ? clamp(best.score * .78 + (best.score - (second?.score || 0)) * .35 + .12) : .28
  const goal = String(best?.node.objective || best?.pack.default_goal || defaultGoal(input.context))
  const risk = riskGate(input.context, input.context.latestInboundText)
  const action = risk.blocksAutonomy ? 'handoff' : actionFor(input.context, best?.node)
  const responseText = risk.blocksAutonomy ? null : composeFromNode(best?.node, input.context, goal)
  const intensity = sanitizeCommercialIntensity(best?.node.commercial_intensity ?? Math.round((input.context.scores.buyingIntent || .2) * 5), input.commercialIntensityCap ?? 5)
  return {
    action,
    responseText,
    confidence: matchConfidence,
    commercialIntensity: intensity,
    goal,
    doctrineNodeIds: best ? ranked.slice(0,3).map(row => row.node.id) : [],
    packId: best?.pack.id || null,
    reasoning: {
      customerType: input.context.customerType,
      serviceLine: input.context.serviceLine,
      journeyStage: input.context.journeyStage,
      intentFamily: input.context.intentFamily,
      relationshipTemperature: input.context.relationshipTemperature,
      momentum: input.context.momentum,
      topMatches: ranked.slice(0,5).map(row => ({ pack: row.pack.name, node: row.node.title, score: row.score, reasons: row.reasons })),
      scores: input.context.scores,
    },
    risk,
    eligibility: risk.blocksAutonomy ? 'red' : matchConfidence >= .82 ? 'green' : matchConfidence >= .55 ? 'blue' : 'amber',
  }
}
