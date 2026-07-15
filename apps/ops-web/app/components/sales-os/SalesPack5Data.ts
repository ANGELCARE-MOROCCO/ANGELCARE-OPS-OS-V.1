
export const auditSamples = [
  { deal: 'Family urgent elderly care · Rabat', score: 82, verdict: 'Strong offer fit, but payment proof and replacement expectations must be locked before activation.', next: 'Send payment-condition message + promise locker summary.' },
  { deal: 'Corporate nurse package · Casablanca', score: 68, verdict: 'Decision-maker unclear and discount pressure is rising. Needs manager review before quote revision.', next: 'Identify payer + decision-maker, then route to Deal Desk.' },
  { deal: 'Academy training lead · Temara', score: 74, verdict: 'Good qualification, weak urgency. Needs proof, date-lock and follow-up calendar.', next: 'Send proof pack + book follow-up within 24h.' },
]

export const lostDealAutopsies = [
  { lost: 'Client chose informal caregiver', rootCause: 'Trust gap + price comparison not reframed', preventable: 'Yes', recovery: 'Send safety/proof comparison and 7-day controlled trial offer' },
  { lost: 'B2B lead stopped responding', rootCause: 'No executive sponsor identified', preventable: 'Yes', recovery: 'Restart with ROI note and ask for decision chain' },
  { lost: 'Family delayed decision', rootCause: 'Urgency was emotional but not operationally anchored', preventable: 'Partial', recovery: 'Reopen with start-date risk and availability window' },
]

export const ceoInterventionQueue = [
  { priority: 'P1', deal: 'Premium long-term care package', trigger: 'High revenue + trust blocker', requiredAction: 'CEO voice note or call to reassure family decision-maker' },
  { priority: 'P2', deal: 'Clinic partnership', trigger: 'Strategic partner + negotiation stalled', requiredAction: 'Executive proposal review and credibility message' },
  { priority: 'P2', deal: 'Corporate training bundle', trigger: 'Multi-site opportunity', requiredAction: 'Approve custom package boundaries' },
]

export const riskSignals = [
  { risk: 'No payment proof', severity: 'Critical', action: 'Block activation unless manager exception is documented' },
  { risk: 'Start date under 24h', severity: 'High', action: 'Check fulfillment readiness and assign ops owner before promise' },
  { risk: 'Decision-maker missing', severity: 'High', action: 'Stop deep negotiation until payer/authority is identified' },
  { risk: 'Custom caregiver promise', severity: 'High', action: 'Rewrite promise into allowed profile boundaries' },
  { risk: 'Repeated discount request', severity: 'Medium', action: 'Move to value proof and manager approval rule' },
]

export const performanceDiagnosis = [
  { seller: 'Agent A', strength: 'Fast response and strong first contact', weakness: 'Weak payment lock', prescription: 'Use payment command script before activation' },
  { seller: 'Agent B', strength: 'Good objection handling', weakness: 'Slow follow-up rhythm', prescription: 'Use follow-up engine every 4h for hot leads' },
  { seller: 'Agent C', strength: 'High empathy', weakness: 'Overpromising caregiver profiles', prescription: 'Use promise locker before closing' },
]

export const sourceRoiDiagnosis = [
  { source: 'Meta Ads', closeRate: 'Medium', paymentQuality: 'Medium', fulfillmentRisk: 'Medium', decision: 'Improve qualification form and segment urgent families' },
  { source: 'WhatsApp referral', closeRate: 'High', paymentQuality: 'High', fulfillmentRisk: 'Low', decision: 'Prioritize and protect referral proof flow' },
  { source: 'Walk-in / phone', closeRate: 'Medium', paymentQuality: 'High', fulfillmentRisk: 'Low', decision: 'Train faster package recommendation' },
]

export const cityZoneHeatmap = [
  { zone: 'Rabat', demand: 'High', closeability: 'High', fulfillment: 'Medium', command: 'Prioritize paid urgent family care, verify availability before promise' },
  { zone: 'Temara', demand: 'Medium', closeability: 'High', fulfillment: 'High', command: 'Push packages with clear start date and referral proof' },
  { zone: 'Casablanca', demand: 'High', closeability: 'Medium', fulfillment: 'Medium', command: 'Separate B2B and family flows, protect margin' },
  { zone: 'Kenitra', demand: 'Medium', closeability: 'Medium', fulfillment: 'Medium', command: 'Use qualification and appointment-based closing' },
]
