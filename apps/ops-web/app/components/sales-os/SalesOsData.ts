export type SalesMode = 'Frontline' | 'Manager' | 'Closing' | 'Fulfillment' | 'Control'
export type SalesOsTool = { title: string; description: string; owner: string; depth: string; route?: string; mode: SalesMode }
export const salesOsRoutes = [
  { label: 'Command Center', href: '/sales/command-center', icon: '🎛️' }, { label: 'Closing Room', href: '/sales/closing-room', icon: '🤝' }, { label: 'Playbooks', href: '/sales/playbooks', icon: '📚' }, { label: 'Objections', href: '/sales/objections', icon: '🛡️' }, { label: 'Quote Builder', href: '/sales/quote-builder', icon: '🧾' }, { label: 'Fulfillment Handoff', href: '/sales/handoff', icon: '🚚' },
]
export const salesExecutionTools: SalesOsTool[] = [
  { title: 'Daily Close Command Board', description: 'Prioritizes deals by urgency, promise date, payment readiness, family pressure, and operational fit.', owner: 'Sales manager', depth: 'Live execution queue', route: '/sales/command-center', mode: 'Control' },
  { title: 'Hot Lead War Room', description: 'Separates leads that need immediate action from leads that only need passive nurturing.', owner: 'Frontline sales', depth: 'Same-day conversion focus', route: '/sales/command-center', mode: 'Frontline' },
  { title: 'Qualification Score', description: 'Scores need clarity, budget, timing, authority, location, service fit, and urgency.', owner: 'Sales agent', depth: 'Pre-close filter', mode: 'Frontline' },
  { title: 'Closing Room', description: 'One-screen path to offer, objection, quote, contract, payment promise, and activation checklist.', owner: 'Closer', depth: 'Deal finalization', route: '/sales/closing-room', mode: 'Closing' },
  { title: 'Objection Library', description: 'Structured answers for price, trust, timing, caregiver profile, replacement, contract, and cancellation concerns.', owner: 'Sales team', depth: 'Conversion scripts', route: '/sales/objections', mode: 'Closing' },
  { title: 'Quote Builder', description: 'Builds service offer logic with package, duration, city, caregiver fit, urgency and approval controls.', owner: 'Sales agent', depth: 'Devis creation', route: '/sales/quote-builder', mode: 'Closing' },
  { title: 'Discount Guardrail', description: 'Requires reason, manager approval, target margin, and impact note before reducing price.', owner: 'Manager', depth: 'Margin protection', mode: 'Manager' },
  { title: 'Fulfillment Handoff', description: 'Locks what operations must receive after a sale: client promise, schedule, service, risks, and deadline.', owner: 'Sales + Ops', depth: 'Sales-to-ops bridge', route: '/sales/handoff', mode: 'Fulfillment' },
  { title: 'Lost Deal Autopsy', description: 'Captures why deals failed and the next prevention action to improve scripts and offers.', owner: 'Manager', depth: 'Learning loop', mode: 'Control' },
  { title: 'Next Best Action', description: 'Recommends whether to call, send WhatsApp, request payment, escalate, re-quote, or pause.', owner: 'System + agent', depth: 'Action guidance', mode: 'Frontline' },
]
export const salesStages = ['Signal', 'Qualified', 'Need Locked', 'Offer Built', 'Objection Cleared', 'Payment Promise', 'Won + Handoff']
export const closingChecklist = ['Client identity and decision-maker confirmed','Need, city, schedule, duration and urgency locked','Recommended package selected and explained','Price, payment method and payment deadline confirmed','Objections documented and resolved','Contract or service confirmation prepared','Fulfillment handoff sent with risk notes']

export const handoffRiskFactors = [
  'Client need not fully confirmed',
  'Schedule or city mismatch risk',
  'Caregiver availability not verified',
  'Payment promise not locked',
  'Operational instructions incomplete',
  'Special family or child requirements missing'
]

export const promiseLockFields = [
  'Amount confirmed',
  'Payment method confirmed',
  'Payment deadline confirmed',
  'Proof of payment requested',
  'Activation condition explained',
  'Follow-up owner assigned'
]

export const salesActionTypes = [
  'Call client',
  'Send WhatsApp recap',
  'Build quote',
  'Confirm quote',
  'Create order',
  'Create invoice',
  'Prepare delivery notice',
  'Escalate to manager'
]

export const salesDecisionRules = [
  'No quote without confirmed client need',
  'No order without confirmed quote',
  'No invoice without order or confirmed quote',
  'No delivery notice without operational handoff',
  'No discount without reason',
  'No lost deal without loss reason'
]
