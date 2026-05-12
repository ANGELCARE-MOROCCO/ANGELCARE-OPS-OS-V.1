import type { ServiceOSBlueprint, ServiceOSCityDeployment, ServiceOSRule } from './types'

export type PricingInput = { blueprint: ServiceOSBlueprint; city?: ServiceOSCityDeployment; rules?: ServiceOSRule[]; urgency?: boolean; night?: boolean; premiumDistrict?: boolean; durationHours?: number; complexityScore?: number }
export function calculateServiceOSPrice(input: PricingInput) {
  const duration = Math.max(1, input.durationHours || 1)
  let price = input.blueprint.basePriceMad * duration
  const applied: string[] = []
  for (const rule of input.rules || []) {
    if (rule.pricingMultiplier && rule.pricingMultiplier !== 1) { price *= rule.pricingMultiplier; applied.push(rule.code) }
    if (rule.pricingModifierMad) { price += rule.pricingModifierMad; applied.push(rule.code) }
  }
  if (input.urgency) { price += 250; applied.push('URGENCY') }
  if (input.night) { price *= 1.25; applied.push('NIGHT') }
  if (input.premiumDistrict) { price *= 1.15; applied.push('PREMIUM_DISTRICT') }
  if (input.complexityScore) { price += input.complexityScore * 35; applied.push('COMPLEXITY') }
  const rounded = Math.round(price / 10) * 10
  const marginMad = Math.round(rounded * (input.blueprint.marginTargetPct / 100))
  return { priceMad: rounded, marginMad, marginPct: input.blueprint.marginTargetPct, applied }
}
