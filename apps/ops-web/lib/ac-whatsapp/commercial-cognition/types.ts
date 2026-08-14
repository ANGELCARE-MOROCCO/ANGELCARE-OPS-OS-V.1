export type CognitionEligibility = 'green'|'blue'|'amber'|'red'
export type CognitionMaturityLevel = 'L0'|'L1'|'L2'|'L3'|'L4'|'L5'|'L6'
export type MomentumState = 'declining'|'stalled'|'neutral'|'advancing'|'accelerating'
export type BuyingReadiness = 'unqualified'|'early'|'exploring'|'evaluating'|'high_intent'|'decision_ready'
export type TrustState = 'fragile'|'low'|'developing'|'established'|'strong'
export type CommercialIntensity = 0|1|2|3|4|5|6
export type CognitionActionType =
  | 'ask' | 'answer' | 'clarify' | 'wait' | 'silence' | 'follow_up'
  | 'reassure' | 'provide_proof' | 'send_knowledge' | 'send_media'
  | 'send_catalogue' | 'qualify' | 'discover_authority' | 'discover_need'
  | 'create_opportunity' | 'update_opportunity' | 'propose_call'
  | 'propose_meeting' | 'propose_assessment' | 'propose_offer'
  | 'close' | 'cross_sell' | 'upsell' | 'reactivate' | 'recover'
  | 'retention_action' | 'referral_request' | 'escalate' | 'handover'
  | 'stop_automation'
export type Goal = {key:string;type:'immediate'|'secondary'|'conversion'|'relationship'|'expansion'|'protection'|'risk';objective:string;priority:number;status:'active'|'waiting'|'achieved'|'blocked'|'abandoned';evidence?:Record<string,unknown>}
export type HiddenIntent = {label:string;confidence:number;evidence:string[]}
export type EmotionalState = {trust:number;hesitation:number;enthusiasm:number;skepticism:number;frustration:number;confusion:number;urgency:number;priceResistance:number;reassuranceNeed:number;engagement:number;fatigue:number}
export type CommercialSignals = {customerType:string;serviceLine:string;explicitIntent:string;hiddenIntents:HiddenIntent[];journeyStage:string;relationshipTemperature:string;momentum:MomentumState;buyingReadiness:BuyingReadiness;trustState:TrustState;emotional:EmotionalState;authorityConfidence:number;conversionProbability:number;commercialPotential:number;churnRisk:number;satisfactionRisk:number}
export type Stakeholder = {key:string;contactId?:string|null;name?:string|null;role:string;authority:number;influence:number;support:'unknown'|'supporter'|'neutral'|'blocker';evidence:string[]}
export type OfferCandidate = {key:string;serviceLine:string;title:string;fit:number;timing:'now'|'seed_later'|'after_conversion'|'after_satisfaction'|'not_now';bundleKeys:string[];reasons:string[];constraints:string[]}
export type ObjectionState = {observed:string[];probableRootCauses:Array<{label:string;confidence:number}>;clarificationNeeded:boolean;recommendedStrategy:string;proofNeeded:string[];authorityRequired:boolean}
export type Commitment = {key:string;owner:'customer'|'angelcare';text:string;dueAt?:string|null;status:'open'|'fulfilled'|'overdue'|'cancelled';sourceMessageId?:string|null;confidence:number}
export type ActionCandidate = {type:CognitionActionType;score:number;rationale:string[];requiresMessage:boolean;payload?:Record<string,unknown>}
export type ConfidenceMatrix = {intent:number;knowledge:number;doctrine:number;action:number;commercial:number;relationship:number;aggregate:number}
export type RiskMatrix = {service:number;commercial:number;customer:number;authority:number;relationship:number;policy:number;aggregate:number;reasons:string[]}
export type CognitionState = {conversationId:string;contactId?:string|null;accountId?:string|null;customerType:string;serviceLine:string;source:string;signals:CommercialSignals;goals:Goal[];stakeholders:Stakeholder[];offers:OfferCandidate[];objections:ObjectionState;commitments:Commitment[];memory:Record<string,unknown>;doctrineNodeIds:string[];doctrinePackIds:string[];maturity:Record<string,CognitionMaturityLevel|string>;lastAction?:CognitionActionType|null;lastDecisionAt?:string|null}
export type CognitionDecision = {idempotencyKey:string;action:ActionCandidate;responseText?:string|null;goal:Goal;confidence:ConfidenceMatrix;risk:RiskMatrix;eligibility:CognitionEligibility;commercialIntensity:CommercialIntensity;escalationReason?:string|null;nextFollowupAt?:string|null;doctrineNodeIds:string[];doctrinePackIds:string[];knowledgeEntityIds:string[];reasoning:Record<string,unknown>}
export type CognitionEvent = {type:'inbound_message'|'scheduled_followup'|'manual_evaluate'|'shadow_evaluate'|'outcome'|'service_event';conversationId:string;inputMessageId?:string|null;eventId?:string|null;dryRun?:boolean;shadow?:boolean;metadata?:Record<string,unknown>}
