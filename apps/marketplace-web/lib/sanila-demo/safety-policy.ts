export const MASTER_DEMO_SAFE_RESULT = 'MASTER_DEMO_SIDE_EFFECT=BLOCKED_OR_SIMULATED'
export type SanilaExternalChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'payment' | 'gps' | 'webhook' | 'integration'
export type SanilaDemoSafetyContext = { isMasterDemo: boolean; configId: string | null; schoolId: string | null; tenantId: string | null; accessStatus: 'active' | 'suspended' | null; safetyStatus: string | null; billingMode: string | null }

export function decideSanilaExternalSideEffect(context: SanilaDemoSafetyContext, simulate = true) {
  if (!context.isMasterDemo) return { allowed: true as const, simulated: false as const, outcome: 'allowed' as const }
  const outcome = simulate ? 'simulated' as const : 'blocked' as const
  return { allowed: false as const, simulated: outcome === 'simulated', outcome, code: MASTER_DEMO_SAFE_RESULT }
}
