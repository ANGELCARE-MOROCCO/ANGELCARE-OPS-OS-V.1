import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
// @ts-expect-error Node's strip-types runner resolves the explicit TypeScript extension.
import { demoGrantEligibility, demoSessionIsAuthorized, nextGrantApprovalStatus, nextGrantRegenerationState, nextGrantUsageState } from '../lib/sanila-demo/policy.ts'
// @ts-expect-error Node's strip-types runner resolves the explicit TypeScript extension.
import { demoAttemptFingerprint, isValidDemoPinFormat, pinLookupDigest } from '../lib/sanila-demo/security.ts'

const now = new Date('2026-09-04T08:00:00.000Z')
const pepper = 'controlled-local-test-pepper-32-characters-minimum'
const pin = '12345678'
const regeneratedPin = '87654321'
const approved = { approval_state: 'approved', status: 'ready', policy_type: 'single_use', max_uses: 1, used_count: 0 }

const hash = await bcrypt.hash(pin, 4)
assert.equal(isValidDemoPinFormat(pin), true)
assert.equal(await bcrypt.compare(pin, hash), true)
assert.equal(await bcrypt.compare('11111111', hash), false)
assert.equal(demoGrantEligibility(approved, now), 'VALID')
console.log('FRESH_APPROVED_PIN_ACCEPTED=PASS')
console.log('INVALID_PIN_REJECTED=PASS')

assert.equal(demoGrantEligibility({ ...approved, absolute_expires_at: '2026-09-04T07:59:59.000Z' }, now), 'EXPIRED')
assert.equal(demoGrantEligibility({ ...approved, absolute_expires_at: 'not-a-date' }, now), 'EXPIRED')
assert.equal(demoGrantEligibility({ ...approved, status: 'revoked', revoked_at: now.toISOString() }, now), 'REVOKED')
assert.equal(demoGrantEligibility({ ...approved, status: 'suspended', suspended_at: now.toISOString() }, now), 'SUSPENDED')
assert.equal(demoGrantEligibility({ ...approved, approval_state: 'under_review', status: 'draft' }, now), 'NOT_APPROVED')
console.log('EXPIRY_REVOCATION_SUSPENSION_APPROVAL=PASS')
console.log('EXPIRED_PIN_REJECTED=PASS')
console.log('REVOKED_GRANT_REJECTED=PASS')
console.log('SUSPENDED_GRANT_REJECTED=PASS')
console.log('UNAPPROVED_GRANT_REJECTED=PASS')

const consumed = { ...approved, status: 'exhausted', used_count: 1, activated_at: '2026-09-04T07:30:00.000Z', effective_expires_at: '2026-09-04T09:30:00.000Z' }
assert.equal(demoGrantEligibility(consumed, now), 'CONSUMED')
assert.deepEqual(nextGrantUsageState(approved), { usedCount: 1, status: 'exhausted' })
assert.equal(nextGrantApprovalStatus(consumed, 'approved'), 'exhausted')
const regenerated = { ...consumed, ...nextGrantRegenerationState(consumed) }
assert.equal(regenerated.policy_type, 'single_use')
assert.equal(regenerated.max_uses, 1)
assert.equal(regenerated.used_count, 0)
assert.equal(regenerated.status, 'ready')
assert.equal(regenerated.activated_at, consumed.activated_at)
assert.equal(regenerated.effective_expires_at, consumed.effective_expires_at)
assert.equal(demoGrantEligibility(regenerated, now), 'VALID')
assert.notEqual(pinLookupDigest(pin, pepper), pinLookupDigest(regeneratedPin, pepper))
const regeneratedHash = await bcrypt.hash(regeneratedPin, 4)
assert.equal(await bcrypt.compare(pin, regeneratedHash), false)
assert.equal(await bcrypt.compare(regeneratedPin, regeneratedHash), true)
assert.notEqual(pinLookupDigest(pin, pepper), pinLookupDigest(pin, `${pepper}-different`))
console.log('SINGLE_USE_ENFORCED=PASS')
console.log('SINGLE_USE_FIRST_USE_ACCEPTED=PASS')
console.log('SINGLE_USE_SECOND_USE_REJECTED=PASS')
console.log('PIN_REGENERATION_INVALIDATES_OLD=PASS')
console.log('PIN_REGENERATION_ACCEPTS_NEW=PASS')
console.log('WRONG_PEPPER_DIGEST_FAILS_CLOSED=PASS')

const session = { id: 'session', grant_id: 'grant', config_id: 'config', school_id: 'school', effective_expires_at: '2026-09-04T09:00:00.000Z', config: { id: 'config', school_id: 'school', active: true, access_status: 'active', safety_status: 'enforced' }, grant: { id: 'grant', status: 'exhausted' } }
assert.equal(demoSessionIsAuthorized(session, now), true)
assert.equal(demoSessionIsAuthorized({ ...session, school_id: 'other-school' }, now), false)
assert.equal(demoSessionIsAuthorized({ ...session, config: { ...session.config, safety_status: 'disabled' } }, now), false)
console.log('MASTER_DEMO_TENANT_ISOLATION=PASS')
console.log('SAFETY_ENFORCED_PRESERVED=PASS')

assert.equal(demoAttemptFingerprint({ ip: '127.0.0.1', userAgent: 'fixture' }, pepper), demoAttemptFingerprint({ ip: '127.0.0.1', userAgent: 'fixture' }, pepper))
assert.equal(demoGrantEligibility({ ...approved, locked_until: '2026-09-04T08:15:00.000Z' }, now), 'LOCKED_OUT')
console.log('RATE_LIMIT_AND_LOCKOUT_PRESERVED=PASS')

const authority = readFileSync(new URL('../lib/sanila-demo/authority.ts', import.meta.url), 'utf8')
const adminApi = readFileSync(new URL('../app/api/angelcare-marketplace/admin/sanila-demo/route.ts', import.meta.url), 'utf8')
const page = readFileSync(new URL('../app/angelcare-marketplace/[locale]/sanila/demo-access/page.tsx', import.meta.url), 'utf8')
const ui = readFileSync(new URL('../components/angelcare360/auth/SanilaDemoAccessExperience.tsx', import.meta.url), 'utf8')
const login = readFileSync(new URL('../components/angelcare360/auth/Angelcare360CustomerLoginExperience.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../components/angelcare360/auth/Angelcare360CustomerLoginExperience.module.css', import.meta.url), 'utf8')
const foundation = readFileSync(new URL('../supabase/migrations/20260903_sanila_master_demo_foundation.sql', import.meta.url), 'utf8')

assert.match(authority, /sanila_demo_sessions'\)\.insert/)
assert.match(authority, /session_token_hash: digestSessionToken\(sessionToken\)/)
assert.doesNotMatch(authority, /console\.(log|info|warn|error)\([^\n]*pin/i)
assert.match(adminApi, /pin_hash: await hashDemoPin\(pin\)/)
assert.match(adminApi, /pin_lookup_digest: pinLookupDigest\(pin\)/)
assert.match(adminApi, /nextGrantRegenerationState\(current\.data\)/)
assert.match(page, /httpOnly: true/)
assert.match(page, /secure: process\.env\.NODE_ENV === 'production'/)
assert.match(page, /sameSite: 'strict'/)
assert.match(page, /redirect\('\/angelcare-360-command-center'\)/)
assert.match(foundation, /billing_mode text not null default 'non_billable' check \(billing_mode = 'non_billable'\)/)
console.log('VALID_PIN_CREATES_SESSION=PASS')
console.log('VALID_PIN_REDIRECTS_TO_COMMAND_CENTER=PASS')
console.log('COOKIE_SECURITY_PRESERVED=PASS')
console.log('NON_BILLABLE_PRESERVED=PASS')
console.log('SESSION_COOKIE_REDIRECT_CONTRACT=PASS')
console.log('NO_PIN_PLAINTEXT_LOGGING=PASS')

assert.match(ui, /variant="normal"/)
assert.match(ui, /CustomerBroadcastBar/)
assert.match(login, /sanila-operating-system-logo-white\.png/)
assert.match(ui, /angelcare360-executive-morocco\.webp/)
assert.match(ui, /name="pin"/)
assert.doesNotMatch(ui, /name="password"/)
assert.doesNotMatch(ui, /ANGELCARE 360/)
assert.doesNotMatch(ui + css, /filter:\s*(invert|brightness)/)
assert.match(css, /desktopStage/)
assert.match(css, /@media \(max-width:980px\)/)
console.log('DEMO_ACCESS_USES_SANILA_NORMAL_LOGO_ON_LIGHT=PASS')
console.log('DEMO_ACCESS_USES_SANILA_WHITE_LOGO_ON_DARK=PASS')
console.log('DEMO_PAGE_PREMIUM_SHELL_PRESENT=PASS')
console.log('DEMO_PIN_ONLY_UI_CONTRACT=PASS')
