import 'server-only'
import type { CommercialCalculation, CommercialUniverse, EligibleRelease, PricingLine } from '../types'

function money(value: number) { return Math.round((Number(value) || 0) * 100) / 100 }
function percent(value: number) { return Math.round((Number(value) || 0) * 100) / 100 }
function clamp(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, Number(value) || 0)) }

export type PricingInput = {
  universe: CommercialUniverse
  items: Array<{ release: EligibleRelease; quantity: number }>
  packagingDh?: number
  handlingDh?: number
  digitalDeliveryDh?: number
  supportDh?: number
  deliveryDh?: number
  licenceDh?: number
  discountPercent?: number
  maximumDiscountPercent?: number
  taxPercent?: number
  minimumMarginPercent?: number
}

export function calculateCommercial(input: PricingInput): CommercialCalculation {
  const warnings: string[] = []
  const maximumDiscount = clamp(input.maximumDiscountPercent ?? 100, 0, 100)
  const requestedDiscount = clamp(input.discountPercent ?? 0, 0, 100)
  const discountPercent = Math.min(requestedDiscount, maximumDiscount)
  if (requestedDiscount > maximumDiscount) warnings.push(`Discount capped at the configured maximum of ${maximumDiscount}%.`)

  const lines: PricingLine[] = input.items.map(({ release, quantity }) => {
    const safeQuantity = Math.max(1, Math.round(Number(quantity) || 1))
    const unitPrice = money(release.basePriceDh ?? 0)
    const unitCost = money(release.unitCostDh ?? 0)
    if (release.basePriceDh == null) warnings.push(`${release.code}: missing price.`)
    if (release.unitCostDh == null) warnings.push(`${release.code}: missing cost basis.`)
    return {
      releaseId: release.id,
      code: release.code,
      label: release.collectionName,
      quantity: safeQuantity,
      unitPriceDh: unitPrice,
      unitCostDh: unitCost,
      priceSubtotalDh: money(unitPrice * safeQuantity),
      costSubtotalDh: money(unitCost * safeQuantity),
    }
  })

  const productRevenueDh = money(lines.reduce((sum, line) => sum + line.priceSubtotalDh, 0))
  const productCostDh = money(lines.reduce((sum, line) => sum + line.costSubtotalDh, 0))
  const packagingDh = money(input.packagingDh ?? (input.universe === 'b2b' ? 25 : 12))
  const handlingDh = money(input.handlingDh ?? (input.universe === 'b2b' ? 18 : 6))
  const digitalDeliveryDh = money(input.digitalDeliveryDh ?? 0)
  const supportDh = money(input.supportDh ?? 0)
  const deliveryDh = money(input.deliveryDh ?? 0)
  const licenceDh = money(input.licenceDh ?? 0)
  const grossBeforeDiscount = money(productRevenueDh + packagingDh + handlingDh + digitalDeliveryDh + supportDh + deliveryDh + licenceDh)
  const discountDh = money(grossBeforeDiscount * discountPercent / 100)
  const taxableBaseDh = money(grossBeforeDiscount - discountDh)
  const taxPercent = clamp(input.taxPercent ?? 0, 0, 100)
  const taxDh = money(taxableBaseDh * taxPercent / 100)
  const finalTotalDh = money(taxableBaseDh + taxDh)
  const totalCostDh = money(productCostDh + packagingDh + handlingDh + digitalDeliveryDh + supportDh + deliveryDh)
  const grossMarginDh = money(taxableBaseDh - totalCostDh)
  const grossMarginPercent = taxableBaseDh > 0 ? percent(grossMarginDh / taxableBaseDh * 100) : 0
  const minimumMarginPercent = clamp(input.minimumMarginPercent ?? 0, -100, 100)
  const marginEligible = grossMarginPercent >= minimumMarginPercent && lines.every((line) => line.unitPriceDh > 0 && line.unitCostDh >= 0)
  if (grossMarginPercent < minimumMarginPercent) warnings.push(`Gross margin ${grossMarginPercent}% is below the ${minimumMarginPercent}% threshold.`)
  if (grossMarginDh < 0) warnings.push('Negative gross margin is not publishable.')
  if (!lines.length) warnings.push('No eligible product line is present.')

  return {
    currency: 'Dh', lines, productRevenueDh, productCostDh, packagingDh, handlingDh, digitalDeliveryDh,
    supportDh, deliveryDh, licenceDh, discountPercent, discountDh, taxableBaseDh, taxPercent, taxDh,
    finalTotalDh, totalCostDh, grossMarginDh, grossMarginPercent, minimumMarginPercent, marginEligible,
    warnings: [...new Set(warnings)], calculatedAt: new Date().toISOString(),
  }
}

export function assertCommercialPublicationEligible(calculation: CommercialCalculation) {
  const findings = [...calculation.warnings]
  if (!calculation.lines.length) findings.push('A sellable must contain at least one product release.')
  if (calculation.lines.some((line) => line.unitPriceDh <= 0)) findings.push('Every product line requires an active positive price.')
  if (!calculation.marginEligible) findings.push('Margin approval is required before publication.')
  return [...new Set(findings)]
}
