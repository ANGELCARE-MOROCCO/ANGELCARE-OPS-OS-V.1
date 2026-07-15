export type PackageInput = {
  segment: 'B2C Family' | 'B2B Facility' | 'Academy' | 'Enterprise'
  urgency: number
  budget: number
  complexity: number
  durationDays: number
  cityFit: number
  decisionPower: number
}

export type QuoteLine = {
  label: string
  quantity: number
  unitPrice: number
  total: number
  note: string
}

export function recommendSalesPackage(input: PackageInput) {
  const intensity = input.urgency + input.complexity + input.durationDays / 2
  if (input.segment === 'Enterprise' || input.segment === 'B2B Facility') return intensity > 150 ? 'Strategic Managed Contract' : 'Professional Coverage Pack'
  if (input.segment === 'Academy') return input.budget >= 70 ? 'Academy Premium Enrollment' : 'Academy Starter Enrollment'
  if (input.urgency >= 80 && input.cityFit >= 70) return 'Urgent Care Activation Pack'
  if (input.durationDays >= 20) return 'Monthly Continuity Pack'
  return 'Essential Family Support Pack'
}

export function computeQuoteRisk(input: PackageInput) {
  let risk = 0
  if (input.budget < 55) risk += 22
  if (input.decisionPower < 55) risk += 18
  if (input.cityFit < 55) risk += 18
  if (input.complexity > 75) risk += 18
  if (input.urgency > 85 && input.budget < 65) risk += 14
  return Math.min(100, risk)
}

export function buildQuoteLines(packageName: string, durationDays: number, baseDailyRate = 350): QuoteLine[] {
  const days = Math.max(1, Math.round(durationDays))
  const activation = packageName.includes('Urgent') ? 450 : packageName.includes('Strategic') ? 950 : 250
  const daily = packageName.includes('Strategic') ? baseDailyRate + 180 : packageName.includes('Monthly') ? baseDailyRate - 35 : baseDailyRate
  return [
    { label: 'Service activation and coordination', quantity: 1, unitPrice: activation, total: activation, note: 'Covers opening, coordination, client briefing and service readiness.' },
    { label: 'Operational service coverage', quantity: days, unitPrice: daily, total: days * daily, note: 'Estimated from selected duration. Adjust final price by service category.' },
    { label: 'Sales-to-fulfillment control', quantity: 1, unitPrice: 0, total: 0, note: 'Mandatory handoff checklist attached to prevent delivery confusion.' },
  ]
}

export function evaluateDiscountRequest(discountPercent: number, quoteRisk: number, paymentReady: boolean) {
  if (discountPercent <= 0) return 'No discount requested. Protect value and proceed to payment proof.'
  if (discountPercent <= 5 && quoteRisk < 45 && paymentReady) return 'Auto-acceptable commercial gesture. Capture reason and payment deadline.'
  if (discountPercent <= 10 && paymentReady) return 'Manager review required. Approve only with same-day payment commitment.'
  if (discountPercent > 10) return 'High discount risk. CEO or senior manager approval required before client promise.'
  return 'Reject or delay discount. Client is not payment-ready enough to justify margin reduction.'
}

export function formatMad(amount: number) {
  return `${Math.round(amount).toLocaleString('fr-MA')} MAD`
}
