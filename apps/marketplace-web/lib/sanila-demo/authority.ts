/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'
import { demoGrantEligibility, demoSessionIsAuthorized, nextGrantUsageState, policyExpiry } from './policy'
import { demoAttemptFingerprint, isValidDemoPinFormat, pinLookupDigest } from './security'
export { generateDemoPin, grantIsUsable, policyExpiry } from './policy'

export const DEMO_COOKIE = 'sanila_demo_session'

type Row = Record<string, any>
const text = (v: unknown) => v == null ? '' : String(v)

export function digestSessionToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function hashDemoPin(pin: string) {
  return bcrypt.hash(pin, 12)
}

export async function getMasterDemoConfig() {
  const db = await createServiceClient()
  const { data, error } = await db.from('sanila_demo_configs').select('*').eq('classification', 'master_demo').eq('active', true).maybeSingle()
  if (error) throw new Error(error.code === '42P01' ? 'La migration SANILA Demo doit être appliquée.' : error.message)
  return data as Row | null
}

export async function recordDemoEvent(input: { configId: string; grantId?: string | null; inquiryId?: string | null; actorUserId?: string | null; eventType: string; severity?: string; metadata?: Row }) {
  const db = await createServiceClient()
  await db.from('sanila_demo_access_events').insert({ config_id: input.configId, grant_id: input.grantId || null, public_inquiry_id: input.inquiryId || null, actor_user_id: input.actorUserId || null, event_type: input.eventType, severity: input.severity || 'info', metadata: input.metadata || {} })
}

export async function authorizeDemoPin(pin: string, requestMeta: { ip?: string | null; userAgent?: string | null } = {}) {
  const config = await getMasterDemoConfig()
  if (!config || config.safety_status !== 'enforced' || config.access_status !== 'active') return { ok: false as const, error: 'La démonstration SANILA est momentanément suspendue.' }
  const db = await createServiceClient()
  const now = new Date()
  const fingerprint = demoAttemptFingerprint(requestMeta)
  const { data: throttle } = await db.from('sanila_demo_pin_attempts').select('locked_until').eq('config_id', config.id).eq('fingerprint_hash', fingerprint).maybeSingle()
  if (throttle?.locked_until && new Date(throttle.locked_until) > now) {
    await recordDemoEvent({ configId: config.id, eventType: 'authorization_throttled', severity: 'warning', metadata: { fingerprint: fingerprint.slice(0, 12) } })
    return { ok: false as const, error: 'Code invalide, expiré ou indisponible.' }
  }
  let candidate: Row | null = null
  if (isValidDemoPinFormat(pin)) {
    const lookupDigest = pinLookupDigest(pin)
    const lookup = await db.from('sanila_demo_access_grants').select('*').eq('config_id', config.id).eq('pin_lookup_digest', lookupDigest).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (lookup.data && await bcrypt.compare(pin, text(lookup.data.pin_hash))) candidate = lookup.data as Row
  }
  const eligibility = candidate ? demoGrantEligibility(candidate, now) : 'INVALID_PIN'
  if (eligibility !== 'VALID') {
    if (candidate) {
      const failed = Number(candidate.failed_attempts || 0) + 1
      await db.from('sanila_demo_access_grants').update({ failed_attempts: failed, locked_until: failed >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null, updated_at: now.toISOString() }).eq('id', candidate.id)
    }
    const attempt = await db.rpc('sanila_register_demo_pin_failure', { p_config_id: config.id, p_fingerprint_hash: fingerprint })
    await recordDemoEvent({ configId: config.id, grantId: candidate?.id || null, inquiryId: candidate?.public_inquiry_id || null, eventType: 'authorization_failed', severity: 'warning', metadata: { reason: eligibility.toLowerCase(), fingerprint: fingerprint.slice(0, 12), throttled: Boolean(attempt.data?.locked) } })
    return { ok: false as const, error: 'Code invalide, expiré ou indisponible.' }
  }
  if (!candidate) return { ok: false as const, error: 'Code invalide, expiré ou indisponible.' }
  const activatedAt = candidate.activated_at ? new Date(candidate.activated_at) : now
  const expiry = policyExpiry({ ...candidate, activated_at: activatedAt.toISOString() }) || new Date(Date.now() + 12 * 3600000)
  const nextUsage = nextGrantUsageState(candidate)
  const update = await db.from('sanila_demo_access_grants').update({ used_count: nextUsage.usedCount, activated_at: activatedAt.toISOString(), effective_expires_at: expiry.toISOString(), status: nextUsage.status, failed_attempts: 0, locked_until: null, last_access_at: now.toISOString(), updated_at: now.toISOString() }).eq('id', candidate.id).eq('used_count', Number(candidate.used_count || 0)).select('*').maybeSingle()
  if (!update.data) return { ok: false as const, error: 'Accès simultané détecté. Réessayez.' }
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const session = await db.from('sanila_demo_sessions').insert({ session_token_hash: digestSessionToken(sessionToken), grant_id: candidate.id, config_id: config.id, school_id: config.school_id, activated_at: activatedAt.toISOString(), effective_expires_at: expiry.toISOString() }).select('id').single()
  if (session.error) return { ok: false as const, error: 'Session de démonstration indisponible.' }
  await db.rpc('sanila_clear_demo_pin_failures', { p_config_id: config.id, p_fingerprint_hash: fingerprint })
  await recordDemoEvent({ configId: config.id, grantId: candidate.id, inquiryId: candidate.public_inquiry_id, eventType: 'authorization_success', severity: 'notice', metadata: { session_id: session.data.id, fingerprint: fingerprint.slice(0, 12) } })
  return { ok: true as const, sessionToken, sessionId: session.data.id, schoolId: config.school_id, expiresAt: expiry.toISOString() }
}

export async function resolveDemoSession(token: string) {
  const db = await createServiceClient()
  const { data } = await db.from('sanila_demo_sessions').select('*, grant:sanila_demo_access_grants(*), config:sanila_demo_configs(*)').eq('session_token_hash', digestSessionToken(token)).maybeSingle()
  if (!demoSessionIsAuthorized(data as Row, new Date())) return null
  await db.from('sanila_demo_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id)
  return data as Row
}
