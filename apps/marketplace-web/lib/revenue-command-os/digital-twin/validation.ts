import type {
  RevenueTwinBootstrap,
  RevenueTwinCompleteness,
  RevenueTwinValidationIssue,
  RevenueTwinValidationSeverity,
} from '../types'

function id(prefix: string, code: string) {
  return `${prefix}-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
}

function issue(input: Omit<RevenueTwinValidationIssue, 'id' | 'detectedAt' | 'status'> & { status?: RevenueTwinValidationIssue['status'] }): RevenueTwinValidationIssue {
  return {
    ...input,
    id: id('validation', `${input.code}-${input.entityCode}`),
    detectedAt: new Date().toISOString(),
    status: input.status || 'open',
  }
}

function weightedScore(entries: Array<{ score: number; weight: number }>) {
  const totalWeight = entries.reduce((total, item) => total + item.weight, 0)
  if (!totalWeight) return 0
  return Math.round(entries.reduce((total, item) => total + item.score * item.weight, 0) / totalWeight)
}

function ratioScore(valid: number, total: number) {
  if (!total) return 0
  return Math.round((valid / total) * 100)
}

export function calculateDigitalTwinCompleteness(twin: Pick<RevenueTwinBootstrap,
  'businessUnits' | 'offers' | 'segments' | 'decisionMakers' | 'markets' | 'journeys' | 'priceRules' | 'capacities' | 'dependencies' | 'seasonalWindows' | 'growthPaths'
>): RevenueTwinCompleteness {
  const businessUnits = ratioScore(twin.businessUnits.filter((item) => item.purpose && item.revenueModel && item.deliveryModel && item.ownerRole).length, twin.businessUnits.length)
  const offers = ratioScore(twin.offers.filter((item) => item.customerProblem && item.valueProposition && item.targetSegmentCodes.length && item.decisionMakerCodes.length && item.requiredCapacityCodes.length).length, twin.offers.length)
  const segments = ratioScore(twin.segments.filter((item) => item.painPoints.length >= 2 && item.buyingTriggers.length >= 2 && item.bestFitOfferCodes.length).length, twin.segments.length)
  const decisionMakers = ratioScore(twin.decisionMakers.filter((item) => item.primaryConcerns.length && item.requiredEvidence.length && item.contactStrategy).length, twin.decisionMakers.length)
  const territories = ratioScore(twin.markets.filter((item) => item.activeBusinessUnitCodes.length && (item.immediatelyDeliverableOfferCodes.length || item.conditionalOfferCodes.length)).length, twin.markets.length)
  const journeys = ratioScore(twin.journeys.filter((item) => item.stages.length >= 3 && item.stages.every((stage) => stage.entryCriteria.length && stage.exitCriteria.length && stage.successEvent && stage.failureEvent)).length, twin.journeys.length)
  const pricing = ratioScore(twin.priceRules.filter((item) => typeof item.publicPrice === 'number' && typeof item.minimumProtectedPrice === 'number' && typeof item.targetMarginPct === 'number' && typeof item.maxDiscountPct === 'number').length, Math.max(twin.offers.length, twin.priceRules.length))
  const capacity = ratioScore(twin.capacities.filter((item) => item.maximumQuantity > 0 && item.offerCodes.length && item.territoryCodes.length).length, twin.capacities.length)
  const dependencies = ratioScore(twin.dependencies.filter((item) => item.rule && item.failureEffect && item.recoveryAction).length, twin.dependencies.length)
  const seasonality = ratioScore(twin.seasonalWindows.filter((item) => item.offerCodes.length && item.segmentCodes.length && item.preparationLeadDays >= 0 && item.recommendedActions.length).length, twin.seasonalWindows.length)
  const expansion = ratioScore(twin.growthPaths.filter((item) => item.triggerSignals.length && item.eligibilityRules.length && item.destinationOfferCode).length, twin.growthPaths.length)
  const overall = weightedScore([
    { score: businessUnits, weight: 10 },
    { score: offers, weight: 15 },
    { score: segments, weight: 10 },
    { score: decisionMakers, weight: 8 },
    { score: territories, weight: 8 },
    { score: journeys, weight: 12 },
    { score: pricing, weight: 12 },
    { score: capacity, weight: 10 },
    { score: dependencies, weight: 6 },
    { score: seasonality, weight: 4 },
    { score: expansion, weight: 5 },
  ])
  return { overall, businessUnits, offers, segments, decisionMakers, territories, journeys, pricing, capacity, dependencies, seasonality, expansion }
}

export function validateDigitalTwin(twin: RevenueTwinBootstrap): RevenueTwinValidationIssue[] {
  const issues: RevenueTwinValidationIssue[] = []
  const offerCodes = new Set(twin.offers.map((item) => item.code))
  const segmentCodes = new Set(twin.segments.map((item) => item.code))
  const decisionMakerCodes = new Set(twin.decisionMakers.map((item) => item.code))
  const marketCodes = new Set(twin.markets.map((item) => item.code))
  const capacityCodes = new Set(twin.capacities.map((item) => item.code))
  const priceByOffer = new Map(twin.priceRules.map((item) => [item.offerCode, item]))

  for (const offer of twin.offers) {
    if (!offer.targetSegmentCodes.length || offer.targetSegmentCodes.some((code) => !segmentCodes.has(code))) {
      issues.push(issue({ code: 'DT-OFFER-SEGMENT', entityType: 'offer', entityCode: offer.code, severity: 'high', category: 'completeness', title: 'Ciblage segment incomplet', detail: `L’offre ${offer.commercialName} ne dispose pas d’un ciblage segment entièrement valide.`, recommendedAction: 'Associer au moins un segment actif et retirer les références inconnues.' }))
    }
    if (!offer.decisionMakerCodes.length || offer.decisionMakerCodes.some((code) => !decisionMakerCodes.has(code))) {
      issues.push(issue({ code: 'DT-OFFER-DECIDER', entityType: 'offer', entityCode: offer.code, severity: 'high', category: 'completeness', title: 'Décideur non gouverné', detail: `L’offre ${offer.commercialName} n’a pas de décideur complet et exploitable.`, recommendedAction: 'Associer les profils décideurs et leurs stratégies de contact.' }))
    }
    const unknownTerritories = offer.territoryCodes.filter((code) => !marketCodes.has(code) && !code.endsWith('CONDITIONAL') && code !== 'MA-NATIONAL')
    if (unknownTerritories.length) {
      issues.push(issue({ code: 'DT-OFFER-TERRITORY', entityType: 'offer', entityCode: offer.code, severity: 'medium', category: 'territory', title: 'Territoire non résolu', detail: `Territoires sans dossier marché: ${unknownTerritories.join(', ')}.`, recommendedAction: 'Créer les marchés ou remplacer les références.' }))
    }
    const unknownCapacities = offer.requiredCapacityCodes.filter((code) => !capacityCodes.has(code))
    if (unknownCapacities.length) {
      issues.push(issue({ code: 'DT-OFFER-CAPACITY', entityType: 'offer', entityCode: offer.code, severity: 'high', category: 'capacity', title: 'Capacité requise non modélisée', detail: `Capacités non enregistrées: ${unknownCapacities.join(', ')}.`, recommendedAction: 'Créer les capacités ou gates de validation manuelle correspondants.' }))
    }
    const price = priceByOffer.get(offer.code)
    if (!price && offer.status === 'active') {
      issues.push(issue({ code: 'DT-OFFER-PRICE', entityType: 'offer', entityCode: offer.code, severity: 'high', category: 'pricing', title: 'Offre active sans price book', detail: `L’offre ${offer.commercialName} ne possède aucun prix gouverné.`, recommendedAction: 'Créer une règle de prix avant toute activation par le futur Strategy Brain.' }))
    } else if (price && (price.minimumProtectedPrice == null || price.maxDiscountPct == null || price.targetMarginPct == null)) {
      issues.push(issue({ code: 'DT-PRICE-PROTECTION', entityType: 'price-rule', entityCode: price.code, severity: 'high', category: 'pricing', title: 'Protection de marge incomplète', detail: `Le prix ${price.code} ne définit pas encore tous les seuils protégés.`, recommendedAction: 'Renseigner coût, prix minimum, marge cible et plafond de remise.' }))
    }
  }

  for (const market of twin.markets) {
    const promoted = [...market.immediatelyDeliverableOfferCodes, ...market.conditionalOfferCodes]
    const unknown = promoted.filter((code) => !offerCodes.has(code))
    if (unknown.length) {
      issues.push(issue({ code: 'DT-MARKET-OFFER', entityType: 'market', entityCode: market.code, severity: 'medium', category: 'territory', title: 'Offre marché inconnue', detail: `Le marché référence des offres inconnues: ${unknown.join(', ')}.`, recommendedAction: 'Corriger les références de disponibilité.' }))
    }
    if (market.conditionalOfferCodes.length && !market.deliveryConstraints.length) {
      issues.push(issue({ code: 'DT-MARKET-CONSTRAINT', entityType: 'market', entityCode: market.code, severity: 'medium', category: 'territory', title: 'Disponibilité conditionnelle sans contraintes', detail: 'Des offres sont conditionnelles mais la raison opérationnelle n’est pas documentée.', recommendedAction: 'Renseigner capacité, déplacement, délai ou approbation requise.' }))
    }
  }

  for (const journey of twin.journeys) {
    if (!journey.stages.length) {
      issues.push(issue({ code: 'DT-JOURNEY-STAGES', entityType: 'journey', entityCode: journey.code, severity: 'critical', category: 'journey', title: 'Parcours sans étapes', detail: `Le parcours ${journey.name} ne peut pas être compilé.`, recommendedAction: 'Définir les étapes, critères, preuves et événements.' }))
      continue
    }
    const sorted = [...journey.stages].sort((a, b) => a.order - b.order)
    if (sorted.some((stage, index) => stage.order !== index + 1)) {
      issues.push(issue({ code: 'DT-JOURNEY-ORDER', entityType: 'journey', entityCode: journey.code, severity: 'high', category: 'journey', title: 'Ordre du parcours incohérent', detail: 'La séquence contient un saut ou doublon de position.', recommendedAction: 'Renuméroter les étapes sans rupture.' }))
    }
  }

  for (const dependency of twin.dependencies) {
    if (dependency.sourceType === 'offer' && !offerCodes.has(dependency.sourceCode)) {
      issues.push(issue({ code: 'DT-DEP-SOURCE', entityType: 'dependency', entityCode: dependency.code, severity: 'high', category: 'dependency', title: 'Source de dépendance absente', detail: `L’offre source ${dependency.sourceCode} est inconnue.`, recommendedAction: 'Réparer ou retirer la dépendance.' }))
    }
    if (dependency.targetType === 'capacity' && !capacityCodes.has(dependency.targetCode) && dependency.targetCode !== 'CAP-CAREGIVERS-BY-CITY' && dependency.targetCode !== 'CAP-LOCAL-DELIVERY') {
      issues.push(issue({ code: 'DT-DEP-TARGET', entityType: 'dependency', entityCode: dependency.code, severity: 'high', category: 'dependency', title: 'Cible de dépendance absente', detail: `La capacité cible ${dependency.targetCode} n’est pas modélisée.`, recommendedAction: 'Créer la capacité ou convertir la dépendance en gate gouverné.' }))
    }
  }

  for (const bundle of twin.bundles) {
    const unknown = bundle.offerCodes.filter((code) => !offerCodes.has(code))
    if (unknown.length) {
      issues.push(issue({ code: 'DT-BUNDLE-OFFER', entityType: 'bundle', entityCode: bundle.code, severity: 'high', category: 'contradiction', title: 'Bundle avec offre inconnue', detail: `Offres inconnues: ${unknown.join(', ')}.`, recommendedAction: 'Corriger les composants du bundle.' }))
    }
  }

  const deduplicated = new Map<string, RevenueTwinValidationIssue>()
  for (const current of [...twin.validationIssues, ...issues]) {
    const key = `${current.code}:${current.entityCode}`
    if (!deduplicated.has(key) || severityRank(current.severity) > severityRank(deduplicated.get(key)!.severity)) deduplicated.set(key, current)
  }
  return [...deduplicated.values()].sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || a.title.localeCompare(b.title))
}

function severityRank(severity: RevenueTwinValidationSeverity) {
  return severity === 'critical' ? 4 : severity === 'high' ? 3 : severity === 'medium' ? 2 : 1
}
