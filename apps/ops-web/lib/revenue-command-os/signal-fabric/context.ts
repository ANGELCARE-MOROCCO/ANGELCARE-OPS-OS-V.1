import 'server-only'
import type { RevenueSignal, RevenueSignalContextSnapshot, RevenueSignalContextSource, RevenueSignalConfidence } from '../types'
import { REVENUE_SIGNAL_VISIBILITY_PROFILES } from './constants'

function confidence(value?: string): RevenueSignalConfidence { return value==='confirmed'||value==='high'||value==='medium'||value==='low'?value:'unknown' }

export function buildSignalContextSnapshot(signal: RevenueSignal, audienceRole: string, visibilityProfile: RevenueSignalContextSnapshot['visibilityProfile'], related: { digitalTwin?: Record<string, unknown>; doctrines?: Array<Record<string, unknown>> } = {}): RevenueSignalContextSnapshot {
  if(!REVENUE_SIGNAL_VISIBILITY_PROFILES.includes(visibilityProfile)) throw new Error('Signal visibility profile is not allowed.')
  const now=new Date()
  const sources: RevenueSignalContextSource[]=[{sourceType:'signal',sourceCode:signal.sourceCode,label:'Signal normalisé',authority:'primary',freshness:'live',retrievedAt:now.toISOString(),redactions:[]}]
  const facts: RevenueSignalContextSnapshot['facts']=[
    {key:'signal-title',label:'Signal',value:signal.title,confidence:signal.confidence,sourceCode:signal.sourceCode},
    {key:'signal-category',label:'Catégorie',value:signal.category,confidence:'confirmed',sourceCode:'SIGNAL-FABRIC'},
    {key:'signal-priority',label:'Priorité calculée',value:`${signal.priorityScore}/100`,confidence:'high',sourceCode:'SIGNAL-FABRIC'},
    {key:'business-unit',label:'Unité commerciale',value:signal.businessUnitCode || 'Non résolue',confidence:signal.businessUnitCode?'high':'unknown',sourceCode:'DIGITAL-TWIN'},
    {key:'market',label:'Marché',value:signal.marketCode || signal.territoryCode || 'Non résolu',confidence:signal.marketCode||signal.territoryCode?'medium':'unknown',sourceCode:'DIGITAL-TWIN'},
  ]
  if(related.digitalTwin) {
    sources.push({sourceType:'digital-twin',sourceCode:'AC-REVENUE-TWIN',label:'Jumeau commercial',authority:'approved',freshness:'fresh',retrievedAt:now.toISOString(),redactions:[]})
    for(const [key,value] of Object.entries(related.digitalTwin).slice(0,8)) facts.push({key:`twin-${key}`,label:key,value:String(value),confidence:'high',sourceCode:'AC-REVENUE-TWIN'})
  }
  if(related.doctrines?.length) {
    sources.push({sourceType:'doctrine',sourceCode:'AC-REVENUE-KNOWLEDGE',label:'Doctrines effectives',authority:'approved',freshness:'fresh',retrievedAt:now.toISOString(),redactions:[]})
    related.doctrines.slice(0,5).forEach((item,index)=>facts.push({key:`doctrine-${index}`,label:'Doctrine applicable',value:String(item.title || item.code || 'Doctrine'),confidence:confidence(String(item.confidence || 'confirmed')),sourceCode:String(item.code || 'AC-REVENUE-KNOWLEDGE')}))
  }
  const redactedFields=['credentials','tokens','cookies','raw_message','full_message_body','private_contact_fields']
  if(visibilityProfile==='commercial-agent') redactedFields.push('financial_internal_cost','restricted_doctrines','executive_notes')
  return {
    id:`ctx-${crypto.randomUUID()}`,code:`CTX-${signal.code}-${Date.now()}`,signalCode:signal.code,
    purpose:'Assembler un contexte vérifiable, minimisé et gouverné pour une future recommandation Revenue OS.',audienceRole,visibilityProfile,status:signal.blockingReasons.length && signal.confidence==='unknown'?'blocked':'ready',generatedAt:now.toISOString(),expiresAt:new Date(now.getTime()+6*60*60*1000).toISOString(),facts,
    hypotheses:[{key:'hypothesis-next-action',statement:'Le signal peut justifier une intervention revenue, sous réserve de validation de la capacité, de l’autorité et des preuves.',validationMethod:'Recouper les sources primaires, le Digital Twin et les doctrines effectives.'}],
    constraints:['Shadow mode obligatoire','Aucune communication externe','Aucun prix ou délai non validé ne devient un fait',...signal.blockingReasons],
    opportunities:signal.opportunityScore>=60?[signal.summary,...signal.recommendedNextActions]:signal.recommendedNextActions,
    risks:signal.riskScore>=60?[signal.summary,...signal.blockingReasons]:signal.blockingReasons,
    sources,redactedFields,completenessScore:Math.min(100,55+facts.length*5+sources.length*5),freshnessScore:90,
  }
}
