export type SalesRole = 'agent' | 'senior_agent' | 'manager' | 'ceo'

const ROLE_LIMITS: Record<SalesRole, number> = {
  agent: 5,
  senior_agent: 10,
  manager: 20,
  ceo: 100,
}

export function getMaxDiscountForRole(role: SalesRole): number {
  return ROLE_LIMITS[role] ?? 0
}

export function requiresDiscountApproval(role: SalesRole, requestedDiscountPercent: number): boolean {
  return requestedDiscountPercent > getMaxDiscountForRole(role)
}

export function calculateDiscountedAmount(amountMad: number, discountPercent: number): number {
  return Math.max(0, Math.round(amountMad * (1 - discountPercent / 100)))
}
