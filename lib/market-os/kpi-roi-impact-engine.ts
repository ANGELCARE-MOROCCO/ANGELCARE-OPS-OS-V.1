export type ImpactStatus = "excellent" | "healthy" | "watch" | "danger"

export type ImpactItem = {
  id: string
  strategy: string
  owner: string
  budgetMad: number
  spentMad: number
  revenueTargetMad: number
  revenueActualMad: number
  leadsTarget: number
  leadsActual: number
  cacTargetMad: number
  cacActualMad: number
  conversionTarget: number
  conversionActual: number
  roi: number
  status: ImpactStatus
  diagnosis: string
  nextAction: string
}

export const impactItems: ImpactItem[] = [
  {
    id: "impact-001",
    strategy: "Postpartum Growth System",
    owner: "Marketing Director",
    budgetMad: 85000,
    spentMad: 38000,
    revenueTargetMad: 450000,
    revenueActualMad: 188000,
    leadsTarget: 900,
    leadsActual: 412,
    cacTargetMad: 420,
    cacActualMad: 510,
    conversionTarget: 13,
    conversionActual: 10.8,
    roi: 4.9,
    status: "watch",
    diagnosis: "Revenue is moving but CAC is above target and conversion is below ambition.",
    nextAction: "Improve offer clarity, strengthen WhatsApp script, and test premium reassurance angle.",
  },
  {
    id: "impact-002",
    strategy: "B2B Clinic Partnership Pipeline",
    owner: "Partnership Lead",
    budgetMad: 42000,
    spentMad: 9000,
    revenueTargetMad: 320000,
    revenueActualMad: 64000,
    leadsTarget: 120,
    leadsActual: 31,
    cacTargetMad: 650,
    cacActualMad: 480,
    conversionTarget: 18,
    conversionActual: 15.5,
    roi: 7.1,
    status: "healthy",
    diagnosis: "Strong early ROI with controlled acquisition cost, but lead volume is still low.",
    nextAction: "Increase qualified outreach volume and prioritize high-maternity clinics.",
  },
  {
    id: "impact-003",
    strategy: "Caregiver Supply Brand Authority",
    owner: "Academy Marketing",
    budgetMad: 22000,
    spentMad: 6500,
    revenueTargetMad: 140000,
    revenueActualMad: 19000,
    leadsTarget: 400,
    leadsActual: 86,
    cacTargetMad: 180,
    cacActualMad: 220,
    conversionTarget: 9,
    conversionActual: 6.4,
    roi: 2.9,
    status: "danger",
    diagnosis: "Weak conversion and low lead quality. Messaging is not yet strong enough.",
    nextAction: "Rebuild positioning around professional future, certification and real job access.",
  },
]

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function impactLabel(status: ImpactStatus) {
  const map: Record<ImpactStatus, string> = {
    excellent: "Excellent",
    healthy: "Healthy",
    watch: "Watch",
    danger: "Danger",
  }
  return map[status]
}

export function progress(actual: number, target: number) {
  if (!target) return 0
  return Math.min(100, Math.round((actual / target) * 100))
}
