export type ServiceOSTone = 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan' | 'indigo'

export type ServiceBlueprint = {
  id: string
  code: string
  title: string
  family: string
  status: 'active' | 'draft' | 'pilot' | 'paused'
  city: string
  baseRateMad: number
  marginTarget: number
  complexity: 'low' | 'medium' | 'high' | 'critical'
  modules: string[]
  rules: string[]
  description: string
}

export type ServiceModule = {
  id: string
  title: string
  category: 'care' | 'education' | 'mobility' | 'medical' | 'operations' | 'commercial' | 'compliance'
  priceImpactMad: number
  required: boolean
}

export type ServiceRule = {
  id: string
  label: string
  trigger: string
  action: string
  pricingModifierMad: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export type CityDeployment = {
  id: string
  city: string
  activeServices: number
  capacityScore: number
  demandScore: number
  readiness: 'launch' | 'scale' | 'optimize' | 'watch'
}

export type ServiceMission = {
  id: string
  serviceId: string
  client: string
  city: string
  status: 'qualification' | 'assigned' | 'live' | 'review' | 'closed'
  slaRisk: 'low' | 'medium' | 'high'
  revenueMad: number
}

export type PriceModifier = {
  label: string
  amount: number
  reason?: string
}

export type CalculatedServicePrice = {
  baseRate: number
  modifiers: PriceModifier[]
  finalPrice: number
  marginEstimate: number
  currency: 'MAD'
}

const blueprints: ServiceBlueprint[] = [
  {
    id: 'svc-special-needs-hybrid',
    code: 'AC-SN-HYBRID',
    title: 'Hybrid Special Needs Childcare & School Support',
    family: 'Special Needs Care',
    status: 'active',
    city: 'Rabat',
    baseRateMad: 420,
    marginTarget: 38,
    complexity: 'critical',
    modules: ['mod-school-support', 'mod-parent-reporting', 'mod-transport', 'mod-sensory-care'],
    rules: ['rule-special-needs-certification', 'rule-night-premium'],
    description: 'Configurable hybrid home and school support for children with specific needs.'
  },
  {
    id: 'svc-postpartum-premium',
    code: 'AC-PP-PREMIUM',
    title: 'Premium Postpartum Mother & Newborn Support',
    family: 'Postpartum Care',
    status: 'active',
    city: 'Casablanca',
    baseRateMad: 520,
    marginTarget: 42,
    complexity: 'high',
    modules: ['mod-newborn-care', 'mod-mother-support', 'mod-night-care', 'mod-parent-reporting'],
    rules: ['rule-newborn-certified-care', 'rule-night-premium'],
    description: 'Premium postnatal service blueprint with newborn, mother wellness and night support.'
  },
  {
    id: 'svc-montessori-after-school',
    code: 'AC-MONT-AFTER',
    title: 'Montessori After-School Enrichment Program',
    family: 'Academy & Education',
    status: 'pilot',
    city: 'Marrakech',
    baseRateMad: 260,
    marginTarget: 35,
    complexity: 'medium',
    modules: ['mod-montessori-activities', 'mod-homework-support', 'mod-parent-reporting'],
    rules: ['rule-age-adapted-program'],
    description: 'After-school enrichment with Montessori, playful learning and parent reporting.'
  }
]

const modules: ServiceModule[] = [
  { id: 'mod-school-support', title: 'School Coordination Support', category: 'education', priceImpactMad: 80, required: false },
  { id: 'mod-parent-reporting', title: 'Parent Reporting & Daily Brief', category: 'operations', priceImpactMad: 35, required: true },
  { id: 'mod-transport', title: 'Transport & Zone Mobility', category: 'mobility', priceImpactMad: 60, required: false },
  { id: 'mod-sensory-care', title: 'Sensory Adapted Care Protocol', category: 'care', priceImpactMad: 120, required: false },
  { id: 'mod-newborn-care', title: 'Newborn Care Protocol', category: 'care', priceImpactMad: 140, required: true },
  { id: 'mod-mother-support', title: 'Mother Wellness Assistance', category: 'medical', priceImpactMad: 110, required: false },
  { id: 'mod-night-care', title: 'Night Support Layer', category: 'care', priceImpactMad: 150, required: false },
  { id: 'mod-montessori-activities', title: 'Montessori Activities Pack', category: 'education', priceImpactMad: 70, required: true },
  { id: 'mod-homework-support', title: 'Homework & Academic Follow-up', category: 'education', priceImpactMad: 55, required: false }
]

const rules: ServiceRule[] = [
  { id: 'rule-special-needs-certification', label: 'Special needs certification required', trigger: 'special_needs = true', action: 'require_specialized_staff', pricingModifierMad: 120, riskLevel: 'critical' },
  { id: 'rule-night-premium', label: 'Night premium after 22:00', trigger: 'hour >= 22', action: 'add_night_premium', pricingModifierMad: 90, riskLevel: 'medium' },
  { id: 'rule-newborn-certified-care', label: 'Newborn certified care required', trigger: 'age_months < 6', action: 'require_newborn_certification', pricingModifierMad: 140, riskLevel: 'high' },
  { id: 'rule-age-adapted-program', label: 'Age adapted activity plan', trigger: 'education_service = true', action: 'attach_age_program', pricingModifierMad: 35, riskLevel: 'low' }
]

const deployments: CityDeployment[] = [
  { id: 'city-rabat', city: 'Rabat', activeServices: 18, capacityScore: 86, demandScore: 91, readiness: 'scale' },
  { id: 'city-casablanca', city: 'Casablanca', activeServices: 22, capacityScore: 74, demandScore: 96, readiness: 'scale' },
  { id: 'city-marrakech', city: 'Marrakech', activeServices: 11, capacityScore: 68, demandScore: 82, readiness: 'launch' },
  { id: 'city-tangier', city: 'Tangier', activeServices: 7, capacityScore: 52, demandScore: 71, readiness: 'watch' }
]

const missions: ServiceMission[] = [
  { id: 'mission-001', serviceId: 'svc-special-needs-hybrid', client: 'Premium Family Account', city: 'Rabat', status: 'live', slaRisk: 'medium', revenueMad: 1450 },
  { id: 'mission-002', serviceId: 'svc-postpartum-premium', client: 'Newborn Support Client', city: 'Casablanca', status: 'assigned', slaRisk: 'low', revenueMad: 2100 },
  { id: 'mission-003', serviceId: 'svc-montessori-after-school', client: 'Academy Family Plan', city: 'Marrakech', status: 'qualification', slaRisk: 'low', revenueMad: 780 }
]

export function getServiceBlueprints(): ServiceBlueprint[] {
  return blueprints
}

export function getServiceModules(): ServiceModule[] {
  return modules
}

export function getServiceRules(): ServiceRule[] {
  return rules
}

export function getCityDeployments(): CityDeployment[] {
  return deployments
}

export function getServiceMissions(): ServiceMission[] {
  return missions
}

export function getServiceBlueprintById(id: string): ServiceBlueprint | undefined {
  return blueprints.find((blueprint) => blueprint.id === id || blueprint.code === id)
}

export function calculateServicePrice(input?: {
  blueprintId?: string
  city?: string
  urgent?: boolean
  night?: boolean
  transport?: boolean
  specialNeeds?: boolean
  complexity?: ServiceBlueprint['complexity']
}): CalculatedServicePrice {
  const blueprint = input?.blueprintId ? getServiceBlueprintById(input.blueprintId) : blueprints[0]
  const baseRate = blueprint?.baseRateMad ?? 300
  const modifiers: PriceModifier[] = []

  if (input?.urgent) modifiers.push({ label: 'Urgency premium', amount: 85, reason: 'Same-day or emergency activation' })
  if (input?.night) modifiers.push({ label: 'Night shift premium', amount: 90, reason: 'Service after 22:00' })
  if (input?.transport) modifiers.push({ label: 'Transport layer', amount: 60, reason: 'Mobility, pickup or district coverage' })
  if (input?.specialNeeds) modifiers.push({ label: 'Specialized care protocol', amount: 120, reason: 'Certified caregiver and adapted SOP' })

  const complexity = input?.complexity ?? blueprint?.complexity
  if (complexity === 'high') modifiers.push({ label: 'High complexity', amount: 95 })
  if (complexity === 'critical') modifiers.push({ label: 'Critical complexity', amount: 150 })

  const city = input?.city ?? blueprint?.city
  if (city === 'Casablanca') modifiers.push({ label: 'Casablanca capacity pressure', amount: 45 })
  if (city === 'Marrakech') modifiers.push({ label: 'Tourism / premium zone logic', amount: 35 })

  const finalPrice = baseRate + modifiers.reduce((sum, modifier) => sum + modifier.amount, 0)
  const marginEstimate = Math.round(finalPrice * ((blueprint?.marginTarget ?? 35) / 100))

  return { baseRate, modifiers, finalPrice, marginEstimate, currency: 'MAD' }
}

export function scoreServiceMatch(input?: {
  city?: string
  specialNeeds?: boolean
  postpartum?: boolean
  education?: boolean
}): Array<{ blueprint: ServiceBlueprint; score: number; reasons: string[] }> {
  return blueprints
    .map((blueprint) => {
      let score = 55
      const reasons: string[] = []
      if (input?.city && blueprint.city === input.city) { score += 15; reasons.push('City deployment match') }
      if (input?.specialNeeds && blueprint.family.includes('Special')) { score += 25; reasons.push('Special needs family match') }
      if (input?.postpartum && blueprint.family.includes('Postpartum')) { score += 25; reasons.push('Postpartum care match') }
      if (input?.education && blueprint.family.includes('Education')) { score += 20; reasons.push('Education service match') }
      if (blueprint.status === 'active') { score += 10; reasons.push('Active service blueprint') }
      return { blueprint, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}

export function getServiceOSDashboardSummary() {
  const activeBlueprints = blueprints.filter((blueprint) => blueprint.status === 'active').length
  const liveMissions = missions.filter((mission) => mission.status === 'live').length
  const totalRevenue = missions.reduce((sum, mission) => sum + mission.revenueMad, 0)
  const averageCapacity = Math.round(deployments.reduce((sum, city) => sum + city.capacityScore, 0) / deployments.length)

  return {
    activeBlueprints,
    totalBlueprints: blueprints.length,
    moduleCount: modules.length,
    ruleCount: rules.length,
    cityCount: deployments.length,
    liveMissions,
    totalRevenue,
    averageCapacity
  }
}
