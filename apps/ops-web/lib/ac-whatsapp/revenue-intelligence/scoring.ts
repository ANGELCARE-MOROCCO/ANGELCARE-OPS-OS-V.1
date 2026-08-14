import type { RevenueContext } from './types'

const normalize = (value: unknown) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const hasAny = (text: string, words: string[]) => words.some(word => text.includes(normalize(word)))
const clamp = (value: number) => Math.max(0, Math.min(1, value))

const lexicons = {
  price: ['prix','tarif','combien','budget','cout','coût','price','pricing','quote','devis'],
  urgency: ['urgent','aujourd hui','aujourd’hui','demain','des que possible','dès que possible','immediately','asap','maintenant'],
  decision: ['decision','décision','directeur','directrice','owner','proprietaire','propriétaire','fondateur','fondatrice','ceo','gérant','gerant'],
  buying: ['interesse','intéressé','interessée','intéressée','commencer','start','signer','contrat','rendez-vous','meeting','disponible','availability','devis','offre'],
  trust: ['fiable','confiance','securite','sécurité','experience','expérience','reference','référence','avis','garantie','qualification'],
  objection: ['cher','trop','pas maintenant','reflechir','réfléchir','comparer','autre fournisseur','already use','deja','déjà','pas besoin'],
  frustration: ['probleme','problème','mecontent','mécontent','decu','déçu','plainte','retard','jamais','inacceptable','frustrated','bad experience'],
  enthusiasm: ['parfait','excellent','super','interessant','intéressant','j aime','j’aime','great','sounds good','ok pour'],
  specialCare: ['autisme','autism','special needs','besoins speciaux','besoins spéciaux','handicap','trisomie','down syndrome'],
  postpartum: ['postpartum','apres accouchement','après accouchement','nouveau ne','nouveau-né','newborn','maman vient d accoucher'],
}

export function inferCustomerType(contact: any, latest: string, source: string) {
  const corpus = normalize(`${contact?.contact_type || ''} ${contact?.organization_name || ''} ${latest} ${source}`)
  if (contact?.organization_name || hasAny(corpus, ['creche','crèche','ecole','école','kindergarten','preschool','entreprise','company','hotel','hôtel','clinique','clinic','corporate','b2b'])) return 'b2b'
  if (hasAny(corpus, ['maman','mother','parent','famille','family','enfant','child','bebe','bébé','garde a domicile','garde à domicile'])) return 'b2c'
  return normalize(contact?.contact_type || 'unknown') || 'unknown'
}

export function inferServiceLine(contact: any, latest: string, source: string) {
  const tags = Array.isArray(contact?.tags) ? contact.tags.join(' ') : ''
  const corpus = normalize(`${latest} ${source} ${tags} ${contact?.organization_name || ''}`)
  const rules: Array<[string,string[]]> = [
    ['b2b_education',['creche','crèche','ecole','école','kindergarten','preschool','sanila','erp','school']],
    ['home_childcare',['garde a domicile','garde à domicile','nounou','nanny','babysitting','home service','garde enfant']],
    ['special_childcare',['special needs','besoins speciaux','besoins spéciaux','autisme','autism','handicap','trisomie']],
    ['postpartum',['postpartum','apres accouchement','après accouchement','newborn','nouveau ne','nouveau-né']],
    ['academy',['formation','training','academy','certification']],
    ['hospitality',['hotel','hôtel','hospitality','kids friendly']],
    ['corporate',['corporate','entreprise','company','rh','hr','employee']],
  ]
  return rules.find(([,terms]) => hasAny(corpus, terms))?.[0] || 'general'
}

export function inferIntentFamily(latest: string, messageCount = 0) {
  const text = normalize(latest)
  if (hasAny(text, lexicons.frustration)) return 'complaint_recovery'
  if (hasAny(text, lexicons.price)) return 'pricing'
  if (hasAny(text, ['catalogue','brochure','presentation','présentation','pdf','document'])) return 'information_request'
  if (hasAny(text, ['partenariat','partnership','collaboration'])) return 'partnership'
  if (hasAny(text, ['disponible','availability','quand','date','horaire','schedule'])) return 'availability'
  if (hasAny(text, lexicons.specialCare)) return 'special_care'
  if (hasAny(text, lexicons.postpartum)) return 'postpartum'
  if (hasAny(text, lexicons.buying)) return messageCount > 3 ? 'closing_signal' : 'commercial_interest'
  if (text.length < 8) return 'short_reply'
  return messageCount <= 1 ? 'first_contact' : 'discovery'
}

export function inferJourneyStage(input: { contact: any; intent: string; messageCount: number }) {
  const explicit = normalize(input.contact?.lead_stage || '')
  const known = ['aware','curious','engaged','qualified','solution_fit','evaluating','objection','decision','closing','converted','onboarding','active_customer','satisfaction','expansion','renewal','recovery','referral']
  if (known.includes(explicit)) return explicit
  if (input.intent === 'complaint_recovery') return 'recovery'
  if (input.intent === 'pricing') return input.messageCount > 4 ? 'evaluating' : 'engaged'
  if (input.intent === 'closing_signal') return 'closing'
  if (input.messageCount <= 1) return 'aware'
  if (input.messageCount <= 3) return 'curious'
  if (input.messageCount <= 7) return 'engaged'
  return 'qualified'
}

export function inferEmotionalSignals(latest: string) {
  const text = normalize(latest)
  return {
    urgency: hasAny(text, lexicons.urgency) ? .85 : .2,
    priceSensitivity: hasAny(text, lexicons.price) ? .72 : .18,
    frustration: hasAny(text, lexicons.frustration) ? .88 : .08,
    enthusiasm: hasAny(text, lexicons.enthusiasm) ? .8 : .18,
    hesitation: hasAny(text, lexicons.objection) ? .76 : .18,
    trustSeeking: hasAny(text, lexicons.trust) ? .72 : .2,
  }
}

export function inferRelationshipTemperature(input: { messageCount: number; latest: string; contact: any }) {
  const text = normalize(input.latest)
  if (hasAny(text, lexicons.frustration)) return 'at_risk'
  if (hasAny(text, lexicons.buying) && input.messageCount >= 3) return 'decision_ready'
  if (input.contact?.lead_stage === 'customer') return 'customer'
  if (input.messageCount >= 8) return 'engaged'
  if (input.messageCount >= 3) return 'warming'
  return 'cold'
}

export function inferMomentum(messages: any[]) {
  const recent = messages.slice(-6)
  const inbound = recent.filter(row => row.direction === 'inbound')
  const detailed = inbound.filter(row => String(row.body || row.caption || '').trim().length > 28)
  if (inbound.length >= 2 && detailed.length >= 1) return 'positive'
  if (!inbound.length) return 'stalled'
  return 'neutral'
}

export function scoreRevenueContext(input: { latest: string; contact: any; messages: any[]; customerType: string; intent: string; emotional: Record<string,number> }) {
  const text = normalize(input.latest)
  const buying = hasAny(text, lexicons.buying) ? .78 : input.messages.length > 5 ? .48 : .28
  const authority = hasAny(text, lexicons.decision) ? .82 : input.customerType === 'b2c' ? .65 : .38
  const urgency = input.emotional.urgency || .2
  const objection = hasAny(text, lexicons.objection) ? .72 : .16
  const engagement = clamp(.18 + Math.min(.6, input.messages.length * .06) + (input.emotional.enthusiasm || 0) * .22)
  const conversion = clamp(buying * .34 + authority * .18 + urgency * .14 + engagement * .28 - objection * .14)
  const commercialPotential = clamp((input.customerType === 'b2b' ? .62 : .45) + buying * .2 + authority * .12)
  const risk = clamp((input.emotional.frustration || 0) * .65 + objection * .22)
  return { buyingIntent: buying, authority, urgency, objection, engagement, conversion, commercialPotential, risk }
}

function extractCommitments(messages:any[]){
  const patterns=[/\b(demain|today|tomorrow|vendredi|samedi|dimanche|lundi|mardi|mercredi|jeudi)\b/i,/\b(semaine prochaine|mois prochain|next week|next month)\b/i,/\b(rappelle(?:z)?|rappeler|call me|recontacte(?:z)?|je reviens|i will come back)\b/i]
  return messages.slice(-24).filter(row=>patterns.some(rx=>rx.test(String(row.body||row.caption||'')))).slice(-6).map(row=>({direction:row.direction,text:String(row.body||row.caption||'').slice(0,320),at:row.created_at||row.received_at||null}))
}
function extractObjectionMemory(messages:any[]){
  const terms=['cher','trop cher','pas maintenant','réfléchir','reflechir','comparer','concurrent','budget','trust','confiance','timing']
  return messages.slice(-30).filter(row=>hasAny(normalize(row.body||row.caption||''),terms)).slice(-6).map(row=>({direction:row.direction,text:String(row.body||row.caption||'').slice(0,320),at:row.created_at||row.received_at||null}))
}
function recentQuestions(messages:any[]){return messages.slice(-20).filter(row=>String(row.body||row.caption||'').includes('?')).slice(-8).map(row=>String(row.body||row.caption||'').slice(0,260))}

export function buildRevenueContext(input: { conversation: any; contact: any; account: any; messages: any[]; source?: string }) : RevenueContext {
  const latestInbound = [...input.messages].reverse().find(row => row.direction === 'inbound')
  const latest = String(latestInbound?.body || latestInbound?.caption || input.conversation?.last_message_preview || '').trim()
  const source = String(input.source || input.conversation?.metadata?.lead_source || input.contact?.metadata?.lead_source || 'whatsapp')
  const customerType = inferCustomerType(input.contact, latest, source)
  const serviceLine = inferServiceLine(input.contact, latest, source)
  const intentFamily = inferIntentFamily(latest, Number(input.conversation?.message_count || input.messages.length || 0))
  const journeyStage = inferJourneyStage({ contact: input.contact, intent: intentFamily, messageCount: Number(input.conversation?.message_count || input.messages.length || 0) })
  const emotionalSignals = inferEmotionalSignals(latest)
  const relationshipTemperature = inferRelationshipTemperature({ messageCount: Number(input.conversation?.message_count || input.messages.length || 0), latest, contact: input.contact })
  const momentum = inferMomentum(input.messages)
  const scores = scoreRevenueContext({ latest, contact: input.contact, messages: input.messages, customerType, intent: intentFamily, emotional: emotionalSignals })
  return {
    conversation: input.conversation,
    contact: input.contact,
    account: input.account,
    messages: input.messages,
    latestInboundText: latest,
    customerType,
    serviceLine,
    source,
    journeyStage,
    intentFamily,
    relationshipTemperature,
    momentum,
    emotionalSignals,
    scores,
    opportunity: {
      customerType, serviceLine, journeyStage, intentFamily,
      conversionProbability: scores.conversion,
      commercialPotential: scores.commercialPotential,
      authorityConfidence: scores.authority,
      urgency: scores.urgency,
      objectionPressure: scores.objection,
    },
    memory: {
      knownName: input.contact?.display_name || null,
      organization: input.contact?.organization_name || null,
      city: input.contact?.city || null,
      tags: input.contact?.tags || [],
      messageCount: input.conversation?.message_count || input.messages.length,
      commitments: extractCommitments(input.messages),
      objections: extractObjectionMemory(input.messages),
      recentQuestions: recentQuestions(input.messages),
      leadSource: source,
    },
  }
}
