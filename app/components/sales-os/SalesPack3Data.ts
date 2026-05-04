export const quoteControlFields = [
  'Client segment and decision-maker',
  'Service category, city and exact schedule',
  'Recommended package and reason',
  'Quote lines and final amount',
  'Discount request and approval status',
  'Payment deadline and proof status',
  'Fulfillment handoff readiness',
]

export const pricingGuardrails = [
  'Never discount before need and decision-maker are locked.',
  'Never promise operational activation before payment condition is clear.',
  'Every discount must have a reason, owner, threshold and approval status.',
  'High urgency should increase control, not trigger panic discount.',
  'Quote risk must be visible before sending the client-facing offer.',
]

export const packageMatrix = [
  { name: 'Essential Family Support Pack', fit: 'Standard B2C family need with moderate urgency and clear schedule.' },
  { name: 'Urgent Care Activation Pack', fit: 'High urgency, ready city coverage, fast decision and immediate service pressure.' },
  { name: 'Monthly Continuity Pack', fit: 'Longer family coverage where price stability and continuity are more important.' },
  { name: 'Professional Coverage Pack', fit: 'B2B or facility request requiring structured service coverage.' },
  { name: 'Strategic Managed Contract', fit: 'High-value, complex, enterprise or multi-site sales opportunity.' },
  { name: 'Academy Premium Enrollment', fit: 'Training/enrollment sale with higher budget and stronger conversion probability.' },
]

export const paymentPromiseStatuses = ['not_requested', 'promised', 'proof_pending', 'verified', 'late', 'blocked']
