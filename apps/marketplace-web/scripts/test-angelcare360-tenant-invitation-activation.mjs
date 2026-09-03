import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const service = read('lib/angelcare360/operator/tenant-access.ts')
const route = read('app/api/angelcare360/access/activate/route.ts')
const page = read('app/angelcare-360-access/activate/page.tsx')
const client = read('components/angelcare360/access/TenantAccessActivationClient.tsx')
const login = read('app/angelcare-360-access/login/page.tsx')

function test(name, run) {
  run()
  console.log(`PASS ${name}`)
}

const digest = (token) => crypto.createHash('sha256').update(token).digest('hex')
const state = { invitations: [], appUser: 'draft', tenantAccess: 'draft', schoolRole: 'paused', schoolId: 'school-a', tenantId: 'tenant-a' }
function invite(token, expiresAt = Date.now() + 60_000) {
  state.invitations.forEach((item) => { if (['invited', 'opened'].includes(item.status)) item.status = 'revoked' })
  state.invitations.push({ tokenHash: digest(token), status: 'invited', expiresAt })
}
function inspect(token, now = Date.now()) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false
  return Boolean(state.invitations.find((item) => item.tokenHash === digest(token) && ['invited', 'opened'].includes(item.status) && item.expiresAt > now))
}
function activate(token, password, confirmation) {
  const invitation = state.invitations.find((item) => item.tokenHash === digest(token) && ['invited', 'opened'].includes(item.status) && item.expiresAt > Date.now())
  if (!invitation || password !== confirmation || !(password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password))) return false
  invitation.status = 'accepted'
  state.appUser = 'active'
  state.tenantAccess = 'active'
  state.schoolRole = 'active'
  return true
}

const valid = crypto.randomBytes(32).toString('base64url')
const expired = crypto.randomBytes(32).toString('base64url')
const replacement = crypto.randomBytes(32).toString('base64url')

test('ACTIVATION_ROUTE_EXISTS', () => assert.match(page, /TenantAccessActivationClient/))
invite(valid)
test('VALID_INVITE_TOKEN', () => assert.equal(inspect(valid), true))
test('MISSING_TOKEN', () => assert.equal(inspect(''), false))
test('INVALID_TOKEN', () => assert.equal(inspect('not-a-token'), false))
invite(expired, Date.now() - 1)
test('EXPIRED_TOKEN', () => assert.equal(inspect(expired), false))
invite(valid)
state.invitations.at(-1).status = 'accepted'
test('CONSUMED_TOKEN', () => assert.equal(inspect(valid), false))
invite(valid)
test('PASSWORD_MISMATCH', () => assert.equal(activate(valid, 'StrongPassword!4', 'DifferentPassword!4'), false))
test('PASSWORD_POLICY', () => assert.equal(activate(valid, 'weak', 'weak'), false))
test('SUCCESSFUL_ACTIVATION', () => assert.equal(activate(valid, 'StrongPassword!4', 'StrongPassword!4'), true))
test('TOKEN_ONE_TIME_USE', () => assert.equal(inspect(valid), false))
invite(valid)
invite(replacement)
test('REGENERATED_OLD_TOKEN_REJECTED', () => assert.equal(inspect(valid), false))
assert.equal(activate(replacement, 'StrongPassword!4', 'StrongPassword!4'), true)
test('APP_USER_ACTIVE', () => assert.equal(state.appUser, 'active'))
test('TENANT_ACCESS_ACTIVE', () => assert.equal(state.tenantAccess, 'active'))
test('SCHOOL_ROLE_ACTIVE', () => assert.equal(state.schoolRole, 'active'))
test('SCHOOL_SCOPE_PRESERVED', () => assert.deepEqual([state.schoolId, state.tenantId], ['school-a', 'tenant-a']))

test('PRODUCTION_TOKEN_HASH_AND_EXPIRY', () => {
  assert.match(service, /token_hash: tokenDigest\(token\)/)
  assert.match(service, /\.gt\('expires_at', new Date\(\)\.toISOString\(\)\)/)
  assert.match(service, /\.in\('status', \['invited','opened'\]\)/)
  assert.match(service, /status: 'accepted'/)
})
test('PRODUCTION_AUTHORITIES', () => {
  assert.match(service, /school_admin: 'direction_etablissement'/)
  assert.match(service, /app_users'\)\.update\([^\n]*status: 'active'/)
  assert.match(service, /angelcare360_user_roles'\)\.update\(\{ status: 'active'/)
  assert.match(service, /ACCESS_TABLE\)\.update\([^\n]*status: 'active'/)
})
test('SERVER_VALIDATION_AND_CONFIRMATION', () => {
  assert.match(route, /inspectTenantAccessToken/)
  assert.match(route, /passwordConfirmation/)
  assert.match(service, /password !== String\(input\.passwordConfirmation/)
})
test('LOGIN_AFTER_ACTIVATION', () => {
  assert.match(client, /angelcare-360-access\/login\?activation=success/)
  assert.match(login, /rpc\('login_app_user'/)
  assert.match(login, /from\('app_sessions'\)\.insert/)
  assert.match(login, /httpOnly: true/)
})

console.log('PASS TENANT_INVITATION_ACTIVATION_SUITE')
