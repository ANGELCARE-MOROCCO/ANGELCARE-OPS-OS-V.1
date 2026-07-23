import type {
  RevenueTwinBusinessUnit,
  RevenueTwinBundle,
  RevenueTwinCapacity,
  RevenueTwinCustomerSegment,
  RevenueTwinDecisionMaker,
  RevenueTwinDependency,
  RevenueTwinGrowthPath,
  RevenueTwinMarket,
  RevenueTwinOffer,
  RevenueTwinOfferRelationship,
  RevenueTwinPriceRule,
  RevenueTwinSalesChannel,
  RevenueTwinSalesJourney,
  RevenueTwinSeasonalWindow,
} from '@/lib/revenue-command-os/types'

export function businessUnitRecord(item: RevenueTwinBusinessUnit): Record<string, unknown> {
  return { ...item, revenue_model: item.revenueModel, delivery_model: item.deliveryModel, owner_role: item.ownerRole, commercial_priority: item.commercialPriority }
}

export function offerRecord(item: RevenueTwinOffer): Record<string, unknown> {
  return { ...item, business_unit_code: item.businessUnitCode, commercial_name: item.commercialName, customer_problem: item.customerProblem, value_proposition: item.valueProposition, delivery_formats: item.deliveryFormats, target_segment_codes: item.targetSegmentCodes, decision_maker_codes: item.decisionMakerCodes, territory_codes: item.territoryCodes, required_capacity_codes: item.requiredCapacityCodes, pricing_model: item.pricingModel, sales_cycle_days: item.salesCycleDays }
}

export function bundleRecord(item: RevenueTwinBundle): Record<string, unknown> {
  return { ...item, commercial_promise: item.commercialPromise, segment_codes: item.segmentCodes, offer_codes: item.offerCodes, bundle_type: item.bundleType, pricing_logic: item.pricingLogic, protected_margin_pct: item.protectedMarginPct }
}

export function relationshipRecord(item: RevenueTwinOfferRelationship): Record<string, unknown> {
  return { ...item, source_offer_code: item.sourceOfferCode, target_offer_code: item.targetOfferCode, relationship_type: item.relationshipType, eligibility_rules: item.eligibilityRules, priority_score: item.priorityScore }
}

export function segmentRecord(item: RevenueTwinCustomerSegment): Record<string, unknown> {
  return { ...item, pain_points: item.painPoints, buying_triggers: item.buyingTriggers, trust_requirements: item.trustRequirements, likely_objections: item.likelyObjections, preferred_channels: item.preferredChannels, best_fit_offer_codes: item.bestFitOfferCodes, commercial_priority: item.commercialPriority }
}

export function decisionMakerRecord(item: RevenueTwinDecisionMaker): Record<string, unknown> {
  return { ...item, role_name: item.roleName, organization_types: item.organizationTypes, authority_level: item.authorityLevel, primary_concerns: item.primaryConcerns, required_evidence: item.requiredEvidence, preferred_style: item.preferredStyle, relevant_offer_codes: item.relevantOfferCodes, contact_strategy: item.contactStrategy }
}

export function marketRecord(item: RevenueTwinMarket): Record<string, unknown> {
  return { ...item, market_maturity: item.marketMaturity, active_business_unit_codes: item.activeBusinessUnitCodes, immediately_deliverable_offer_codes: item.immediatelyDeliverableOfferCodes, conditional_offer_codes: item.conditionalOfferCodes, delivery_constraints: item.deliveryConstraints }
}

export function channelRecord(item: RevenueTwinSalesChannel): Record<string, unknown> {
  return { ...item, channel_type: item.channelType, best_for_stages: item.bestForStages, best_for_segments: item.bestForSegments }
}

export function journeyRecord(item: RevenueTwinSalesJourney): Record<string, unknown> {
  return { ...item, business_unit_codes: item.businessUnitCodes, segment_codes: item.segmentCodes, offer_codes: item.offerCodes }
}

export function priceRuleRecord(item: RevenueTwinPriceRule): Record<string, unknown> {
  return { ...item, offer_code: item.offerCode, price_book: item.priceBook, pricing_model: item.pricingModel, public_price: item.publicPrice, partner_price: item.partnerPrice, internal_cost: item.internalCost, delivery_cost: item.deliveryCost, minimum_protected_price: item.minimumProtectedPrice, target_margin_pct: item.targetMarginPct, max_discount_pct: item.maxDiscountPct, approval_role: item.approvalRole, effective_from: item.effectiveFrom, effective_to: item.effectiveTo }
}

export function capacityRecord(item: RevenueTwinCapacity): Record<string, unknown> {
  return { ...item, capacity_type: item.capacityType, available_quantity: item.availableQuantity, reserved_quantity: item.reservedQuantity, maximum_quantity: item.maximumQuantity, territory_codes: item.territoryCodes, offer_codes: item.offerCodes, lead_time_days: item.leadTimeDays }
}

export function seasonalWindowRecord(item: RevenueTwinSeasonalWindow): Record<string, unknown> {
  return { ...item, start_month_day: item.startMonthDay, end_month_day: item.endMonthDay, segment_codes: item.segmentCodes, offer_codes: item.offerCodes, preparation_lead_days: item.preparationLeadDays, risk_of_delay: item.riskOfDelay, recommended_actions: item.recommendedActions }
}

export function growthPathRecord(item: RevenueTwinGrowthPath): Record<string, unknown> {
  return { ...item, path_type: item.pathType, source_offer_code: item.sourceOfferCode, destination_offer_code: item.destinationOfferCode, trigger_signals: item.triggerSignals, eligibility_rules: item.eligibilityRules, recommended_timing: item.recommendedTiming, priority_score: item.priorityScore }
}

export function dependencyRecord(item: RevenueTwinDependency): Record<string, unknown> {
  return { ...item, source_type: item.sourceType, source_code: item.sourceCode, dependency_type: item.dependencyType, target_type: item.targetType, target_code: item.targetCode, failure_effect: item.failureEffect, recovery_action: item.recoveryAction }
}
