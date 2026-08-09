import type { RevenueSignal, RevenueSignalCategory, RevenueSignalConfidence, RevenueSignalIngestionInput, RevenueSignalRule, RevenueSignalSeverity } from '../types'
import { getRevenueSignalAdapter, pickFirst } from './adapters'

function text(payload: Record<string, unknown>) { return Object.values(payload).filter((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean').join(' ').toLowerCase() }
function number(payload: Record<string, unknown>, fields: string[]) { for (const field of fields) { const value=Number(payload[field]); if(Number.isFinite(value)) return value } return 0 }
function containsAny(value: string, terms: string[]) { return terms.some((term) => value.includes(term)) }

export function classifyRevenueSignal(input: RevenueSignalIngestionInput, rules: RevenueSignalRule[]): Omit<RevenueSignal, 'id'|'code'|'rawEventId'|'detectedAt'> {
  const adapter=getRevenueSignalAdapter(input.sourceCode)
  const raw=text(input.payload)
  let category: RevenueSignalCategory=adapter?.category || 'data-quality'
  let signalType=adapter?.defaultEventType || input.eventType
  let severity: RevenueSignalSeverity='medium'
  let confidence: RevenueSignalConfidence=input.sourceRecordId ? 'high' : 'medium'
  let urgency=45, opportunity=35, risk=25
  const blockingReasons: string[]=[]
  const nextActions: string[]=[]
  const commandFamilies: string[]=[]

  if (containsAny(raw,['overdue','impay','en retard','promise missed','échéance dépassée'])) { category='payment'; signalType='payment.overdue'; severity='critical'; urgency=95; risk=92; nextActions.push('Vérifier la créance et préparer un plan de récupération revenu'); commandFamilies.push('revenue-rescue','collections') }
  else if (containsAny(raw,['complaint','réclamation','incident','unhappy','churn','résiliation'])) { category='customer-risk'; signalType='customer.risk'; severity='high'; urgency=86; risk=88; nextActions.push('Qualifier le risque client et préparer une intervention de réassurance'); commandFamilies.push('customer-rescue','retention') }
  else if (containsAny(raw,['replied','reply','répondu','interested','intéressé','appointment requested','rdv'])) { category='account-intent'; signalType='account.high-intent'; severity='high'; urgency=82; opportunity=88; nextActions.push('Construire le contexte du compte et proposer la meilleure prochaine action'); commandFamilies.push('qualification','meeting-generation') }
  else if (containsAny(raw,['proposal sent','proposition envoyée','quotation sent','devis envoyé'])) { category='proposal'; signalType='proposal.follow-up-window'; severity='medium'; urgency=68; opportunity=72; nextActions.push('Programmer le contrôle du délai de suivi de proposition'); commandFamilies.push('proposal-progression','closing') }
  else if (containsAny(raw,['meeting','rendez-vous','appointment','scheduled'])) { category='meeting'; signalType='meeting.readiness'; severity='medium'; urgency=72; opportunity=68; nextActions.push('Préparer le brief du rendez-vous et vérifier les preuves disponibles'); commandFamilies.push('meeting-diagnostic') }
  else if (containsAny(raw,['capacity low','unavailable','indisponible','full','saturated','complet'])) { category='capacity'; signalType='capacity.constraint'; severity='high'; urgency=78; risk=82; blockingReasons.push('Capacité ou disponibilité potentiellement insuffisante'); nextActions.push('Vérifier la faisabilité commerciale avant toute promesse'); commandFamilies.push('capacity-protection') }
  else if (containsAny(raw,['renewal','renouvellement','expires','expire'])) { category='renewal'; signalType='renewal.window'; severity='medium'; urgency=65; opportunity=80; nextActions.push('Évaluer le potentiel de renouvellement et d’expansion'); commandFamilies.push('renewal','upsell') }
  else if (adapter?.category === 'market-opportunity') { severity='medium'; opportunity=Math.min(95,50+number(input.payload,['score','commercial_score','potential_score'])/2); nextActions.push('Résoudre l’identité du compte et évaluer le potentiel'); commandFamilies.push('account-discovery','segmentation') }

  const matched=rules.filter((rule)=>rule.enabled && (rule.sourceCodes.length===0 || rule.sourceCodes.includes(input.sourceCode)) && (rule.eventTypes.length===0 || rule.eventTypes.includes(input.eventType)))
  if(matched[0]) { category=matched[0].category; signalType=matched[0].signalType; if(commandFamilies.length===0) commandFamilies.push(...matched[0].recommendedCommandFamilies) }

  const label=pickFirst(input.payload,adapter?.labelFields || ['title','name','subject']) || `${input.sourceCode} · ${input.eventType}`
  const status=pickFirst(input.payload,adapter?.statusFields || ['status','stage'])
  const evidence=[{source:input.sourceCode,label:'Événement observé',value:input.eventType,observedAt:input.occurredAt || new Date().toISOString()}]
  if(status) evidence.push({source:input.sourceCode,label:'Statut source',value:status,observedAt:input.occurredAt || new Date().toISOString()})

  const priority=Math.max(0,Math.min(100,Math.round(urgency*.35+opportunity*.35+risk*.3)))
  return {
    sourceCode: input.sourceCode, category, signalType,
    title: label, summary: `Signal ${category} détecté depuis ${input.sourceCode}${status ? ` · statut ${status}` : ''}.`,
    businessUnitCode: pickFirst(input.payload,['business_unit_code','business_unit','unit_code']),
    marketCode: pickFirst(input.payload,['market_code','city_code','market']), territoryCode: pickFirst(input.payload,['territory_code','city','territory']),
    offerCode: pickFirst(input.payload,['offer_code','service_code','product_code']), segmentCode: pickFirst(input.payload,['segment_code','customer_segment']),
    severity, confidence, priorityScore:priority, urgencyScore:urgency, opportunityScore:opportunity, riskScore:risk,
    status:'new', occurredAt:input.occurredAt || new Date().toISOString(),
    expiresAt:new Date(Date.now()+Math.max(60,matched[0]?.expiryMinutes || 1440)*60000).toISOString(),
    ownerRole:category==='payment'?'Finance & Collections':category==='capacity'?'Operations / Academy':'Revenue Manager',
    entities:[{entityType:adapter?.entityType || 'unknown',entityId:input.sourceRecordId,label,relationship:'primary'}],
    evidence,recommendedCommandFamilies:[...new Set(commandFamilies)],recommendedNextActions:nextActions,blockingReasons,
    metadata:{correlationId:input.correlationId || null,ruleCodes:matched.map((x)=>x.code),sourceStatus:status || null},
  }
}
