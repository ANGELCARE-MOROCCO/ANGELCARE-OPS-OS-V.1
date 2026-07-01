'use client'

export type Ac360BlockedActionUi = {
  blocked?: boolean
  severity?: 'info' | 'warning' | 'critical' | string
  title?: string
  message?: string
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; href: string }
  supportHint?: string
}

export function normalizeAc360BlockedAction(errorPayload: any): Ac360BlockedActionUi | null {
  const ui = errorPayload?.ac360?.ui
  if (ui) return ui
  if (!errorPayload?.ac360?.blocked) return null
  return {
    blocked: true,
    severity: errorPayload.ac360.decision === 'policy_locked' ? 'critical' : 'warning',
    title: 'Action blocked by AngelCare 360',
    message: errorPayload.ac360.reason || errorPayload.error || 'This action is not allowed by the current package, credits, restrictions or policy safety lock.',
    primaryAction: { label: 'Open Billing Center', href: '/angelcare-360/billing-center' },
    secondaryAction: { label: 'Open Policy Lock', href: '/angelcare-360/policy-lock' },
    supportHint: 'Resolve package limits, credits, restrictions or request a controlled admin override.',
  }
}

export function useAc360BlockedAction() {
  return { normalizeAc360BlockedAction }
}
