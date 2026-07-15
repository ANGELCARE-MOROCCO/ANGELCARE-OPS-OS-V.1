
export const upsellRenewalEngine = [
  { layer: 'Renewal trigger control', action: 'Detect every client reaching renewal window and force a contact plan before the service expires.', output: 'Renewal action card with owner, deadline, script and risk level.' },
  { layer: 'Upsell timing', action: 'Score whether the client is ready for a larger package based on satisfaction, usage, payment discipline and urgency.', output: 'Upsell readiness score with recommended next offer.' },
  { layer: 'Retention proof', action: 'Collect proof points from delivery and client feedback before making a renewal proposal.', output: 'Proof-backed renewal argument.' },
  { layer: 'Payment behavior', action: 'Separate high-value reliable clients from fragile accounts requiring stricter payment terms.', output: 'Renewal payment policy recommendation.' },
]

export const crossSellRecommender = [
  { client: 'Parent needing home support', primary: 'Home care package', recommended: ['Academy training add-on', 'Emergency replacement cover', 'Monthly family reporting'], rule: 'Recommend only if service pain is recurring and family values continuity.' },
  { client: 'B2B facility', primary: 'Staffing support', recommended: ['Compliance onboarding', 'Training package', 'Quality audit visit'], rule: 'Recommend when client needs reliability, reporting and fewer incidents.' },
  { client: 'Academy learner', primary: 'Training program', recommended: ['Placement support', 'Certification pack', 'Field coaching'], rule: 'Recommend when learner needs professional activation after training.' },
]

export const personaClassifier = [
  'Urgency buyer: needs speed, clear availability, simple pricing, instant confirmation and firm next step.',
  'Trust buyer: needs proof, references, procedure clarity, contract security and manager assurance.',
  'Price-sensitive buyer: needs package comparison, minimum viable offer, staged payment and value explanation.',
  'Corporate buyer: needs documentation, SLA, invoice readiness, compliance, reporting and escalation flow.',
  'Emotional family buyer: needs empathy, reassurance, human quality, continuity and activation confidence.',
]

export const serviceFitMatrix = [
  { factor: 'Need severity', lowFit: 'Nice-to-have request', highFit: 'Daily operational pain or urgent family need', action: 'Prioritize high severity for same-day closing.' },
  { factor: 'Ability to fulfill', lowFit: 'No available staff or unclear start area', highFit: 'Capacity confirmed and start date realistic', action: 'Never close without fulfillment readiness.' },
  { factor: 'Payment readiness', lowFit: 'Vague budget and no payer identified', highFit: 'Payer, amount and payment method confirmed', action: 'Move only ready clients into closing room.' },
  { factor: 'Decision structure', lowFit: 'Influencer only', highFit: 'Decision-maker and payer present', action: 'Force decision-maker contact before quote lock.' },
]

export const territoryExpansionControl = [
  { zone: 'Rabat / Temara / Salé', signal: 'High family-service demand and manageable fulfillment distance', control: 'Prioritize premium family and recurring home support offers.' },
  { zone: 'Casablanca', signal: 'Bigger volume but higher operational friction', control: 'Close only with stronger handoff and capacity confirmation.' },
  { zone: 'Kenitra', signal: 'Good academy and service adoption potential', control: 'Use academy-to-service cross-sell and controlled follow-up cadence.' },
]

export const dealExpansionBoard = [
  'After close, classify the deal as one-time, recurring, expandable, strategic, or referral-capable.',
  'Assign expansion owner before fulfillment starts, not after the client disappears.',
  'Create next expansion moment: day 7 satisfaction, day 15 proof, day 25 renewal, month-end referral request.',
  'Prevent aggressive upsell when fulfillment risk is unresolved.',
]

export const clientValueLadder = [
  { level: 'Entry', objective: 'Close first safe service', control: 'Simple package, strict expectations, clear payment.' },
  { level: 'Stable', objective: 'Convert into recurring revenue', control: 'Monthly plan, continuity promise, reporting rhythm.' },
  { level: 'Premium', objective: 'Increase value without friction', control: 'Priority coverage, quality audit, manager touchpoint.' },
  { level: 'Strategic', objective: 'Build account or ambassador value', control: 'Referral, B2B intro, partner offer, executive care.' },
]

export const renewalRiskControl = [
  { risk: 'Silent client', detection: 'No reply before renewal window', response: 'Switch channel, manager message, proof summary, clear deadline.' },
  { risk: 'Service dissatisfaction', detection: 'Complaint, replacement request or weak feedback', response: 'Resolve delivery issue before commercial ask.' },
  { risk: 'Payment delay', detection: 'Late or partial payment history', response: 'Renew with stricter payment condition and smaller exposure.' },
  { risk: 'Competitor comparison', detection: 'Asks for cheaper options or delays decision', response: 'Use proof, continuity value, risk of switching and service guarantee.' },
]
