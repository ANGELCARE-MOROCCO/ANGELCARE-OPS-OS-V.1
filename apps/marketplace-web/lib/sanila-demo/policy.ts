/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'

type Row = Record<string, any>
export type SanilaDemoGrantEligibility = 'VALID' | 'LOCKED_OUT' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED' | 'NOT_APPROVED' | 'CONSUMED'
export const PIN_LENGTH = 8
export const SANILA_MASTER_DEMO_SEED_VERSION = 'SANILA_MASTER_DEMO_SEED_2026_09_V1'
export type SanilaDemoMutationClass = 'SAFE_READ' | 'SAFE_DEMO_MUTATION' | 'BLOCKED_DESTRUCTIVE' | 'BLOCKED_EXTERNAL_SIDE_EFFECT'
const DESTRUCTIVE = new Set(['delete','purge','archive_school','close_school','delete_student','delete_staff','delete_class','delete_academic_year','reset','tenant_suspend','subscription_change'])
const EXTERNAL = new Set(['email.send','sms.send','whatsapp.send','push.send','payment.checkout','payment.charge','payment.capture','payment.refund','payment.customer.create','payment.link.send','gps.dispatch','gps.sync','webhook.dispatch','webhook.send','integration.dispatch','integration.sync'])
export function classifyMasterDemoOperation(operation: string): SanilaDemoMutationClass {
  const key = String(operation || '').trim().toLowerCase()
  if (!key || key.endsWith('.view') || key.startsWith('list') || key.startsWith('get') || key === 'verify') return 'SAFE_READ'
  if (EXTERNAL.has(key) || [...EXTERNAL].some(prefix => key.startsWith(`${prefix}.`))) return 'BLOCKED_EXTERNAL_SIDE_EFFECT'
  const externalTokens = key.split(/[.:/_-]+/)
  if (externalTokens.some((token) => ['email','sms','whatsapp','push','payment','gps','webhook','integration','provider'].includes(token)) && externalTokens.some((token) => ['send','dispatch','checkout','charge','capture','refund','sync','deliver','invoke'].includes(token))) return 'BLOCKED_EXTERNAL_SIDE_EFFECT'
  if (/^(access|security|permission|role|user[._-]role|identity|operator[._-]tenant)([.:/_-]|$)/.test(key)) return 'BLOCKED_DESTRUCTIVE'
  const tokens = key.split(/[.:/_-]+/)
  if (DESTRUCTIVE.has(key) || tokens.includes('delete') || tokens.includes('purge') || (tokens.includes('archive') && (tokens.includes('school') || tokens.includes('academic')))) return 'BLOCKED_DESTRUCTIVE'
  return 'SAFE_DEMO_MUTATION'
}
export function generateDemoPin() { return String(crypto.randomInt(10 ** (PIN_LENGTH - 1), 10 ** PIN_LENGTH)) }
export function policyExpiry(grant: Row) {
  const absolute = grant.absolute_expires_at ? new Date(grant.absolute_expires_at) : null
  const duration = grant.activation_duration_minutes && grant.activated_at ? new Date(new Date(grant.activated_at).getTime() + Number(grant.activation_duration_minutes) * 60000) : null
  return [absolute, duration].filter(Boolean).sort((a, b) => (a as Date).getTime() - (b as Date).getTime())[0] || null
}
export function demoGrantEligibility(grant: Row, now = new Date()): SanilaDemoGrantEligibility {
  const status = String(grant.status)
  if (grant.revoked_at || status === 'revoked') return 'REVOKED'
  if (grant.suspended_at || status === 'suspended') return 'SUSPENDED'
  if (grant.approval_state !== 'approved') return 'NOT_APPROVED'
  if (status === 'expired') return 'EXPIRED'
  if (status === 'used' || status === 'exhausted' || (grant.max_uses && Number(grant.used_count || 0) >= Number(grant.max_uses))) return 'CONSUMED'
  if (grant.locked_until && new Date(grant.locked_until) > now) return 'LOCKED_OUT'
  const expiry = policyExpiry(grant)
  if (expiry && (!Number.isFinite(expiry.getTime()) || expiry <= now)) return 'EXPIRED'
  return ['ready', 'active'].includes(status) ? 'VALID' : 'NOT_APPROVED'
}

export function grantIsUsable(grant: Row, now = new Date()) {
  return demoGrantEligibility(grant, now) === 'VALID'
}

export function nextGrantApprovalStatus(grant: Row, approvalState: string) {
  const status = String(grant.status)
  if (['revoked', 'suspended', 'expired'].includes(status)) return status
  if (approvalState !== 'approved') return 'draft'
  if (status === 'used' || status === 'exhausted' || (grant.max_uses && Number(grant.used_count || 0) >= Number(grant.max_uses))) return 'exhausted'
  return status === 'active' ? 'active' : 'ready'
}

export function nextGrantRegenerationState(grant: Row) {
  const status = String(grant.status)
  return {
    used_count: 0,
    status: ['suspended', 'expired'].includes(status) ? status : grant.approval_state === 'approved' ? 'ready' : 'draft',
  }
}

export function nextGrantUsageState(grant: Row) {
  const usedCount = Number(grant.used_count || 0) + 1
  const exhausted = Number.isFinite(Number(grant.max_uses)) && grant.max_uses !== null && usedCount >= Number(grant.max_uses)
  return { usedCount, status: exhausted ? 'exhausted' as const : 'active' as const }
}

export function demoSessionIsAuthorized(session: Row, now = new Date()) {
  return Boolean(session)
    && !session.revoked_at
    && session.config?.active === true
    && session.config?.access_status === 'active'
    && session.config?.safety_status === 'enforced'
    && ['active', 'exhausted'].includes(String(session.grant?.status))
    && new Date(session.effective_expires_at).getTime() > now.getTime()
    && String(session.school_id) === String(session.config?.school_id)
    && String(session.config_id) === String(session.config?.id)
    && String(session.grant_id) === String(session.grant?.id)
}
