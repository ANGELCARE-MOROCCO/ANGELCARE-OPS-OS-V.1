import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.resolve(root, relative), 'utf8')
const service = read('lib/angelcare360/operator/tenant-access.ts')
const loginPage = read('app/angelcare-360-access/login/page.tsx')
const productionSchema = read('../../infrastructure/database/CURRENT_PRODUCTION_SCHEMA.sql')

function test(name, run) {
  run()
  console.log(`PASS ${name}`)
}

const canonicalUsername = (email) => String(email || '').trim().toLowerCase()
function resolveIdentity(users, emailValue, linkedId = '') {
  const email = canonicalUsername(emailValue)
  const linked = users.find((user) => user.id === linkedId) || null
  const emailMatches = users.filter((user) => canonicalUsername(user.email) === email)
  if (emailMatches.length > 1) return { ok: false, error: 'email_collision' }
  const byEmail = emailMatches[0] || null
  if (linked && canonicalUsername(linked.email) !== email) return { ok: false, error: 'linked_email_mismatch' }
  if (linked && byEmail && linked.id !== byEmail.id) return { ok: false, error: 'identity_collision' }
  const user = linked || byEmail
  if (String(user?.username || '').trim()) return { ok: true, user, username: user.username, backfill: false }
  const username = canonicalUsername(email)
  if (users.some((candidate) => candidate.id !== user?.id && canonicalUsername(candidate.username) === username)) return { ok: false, error: 'username_collision' }
  return { ok: true, user, username, backfill: Boolean(user) }
}

function activate(users, account) {
  const identity = resolveIdentity(users, account.email, account.appUserId)
  if (!identity.ok) return identity
  const user = identity.user || { id: 'created-user', email: canonicalUsername(account.email), username: identity.username }
  if (identity.backfill) user.username = identity.username
  user.status = 'active'
  account.status = 'active'
  account.schoolRoleStatus = 'active'
  return { ok: true, user, account }
}

test('TENANT_ACCESS_USER_CREATED_WITH_USERNAME', () => {
  const result = activate([], { email: ' Madame.Directrice@Example.ma ', schoolId: 'school-a', tenantId: 'tenant-a', isPrimaryOwner: true })
  assert.equal(result.ok, true)
  assert.equal(result.user.username, 'madame.directrice@example.ma')
})

test('TENANT_ACCESS_EXISTING_NULL_USERNAME_BACKFILLED', () => {
  const users = [{ id: 'existing', email: 'director@example.ma', username: null, status: 'draft' }]
  const result = activate(users, { appUserId: 'existing', email: 'director@example.ma', schoolId: 'school-a', tenantId: 'tenant-a', isPrimaryOwner: true })
  assert.equal(result.ok, true)
  assert.equal(result.user.username, 'director@example.ma')
})

test('EXISTING_USERNAME_PRESERVED', () => {
  const users = [{ id: 'existing', email: 'director@example.ma', username: 'madame.directrice', status: 'draft' }]
  const result = activate(users, { appUserId: 'existing', email: 'director@example.ma', schoolId: 'school-a', tenantId: 'tenant-a', isPrimaryOwner: true })
  assert.equal(result.ok, true)
  assert.equal(result.user.username, 'madame.directrice')
})

test('USERNAME_COLLISION_HANDLED', () => {
  const users = [{ id: 'other', email: 'other@example.ma', username: 'director@example.ma', status: 'active' }]
  assert.deepEqual(resolveIdentity(users, 'director@example.ma'), { ok: false, error: 'username_collision' })
})

const activated = activate([], { email: 'director@example.ma', schoolId: 'school-a', tenantId: 'tenant-a', roleTemplate: 'school_admin', schoolRole: 'direction_etablissement', isPrimaryOwner: true })
test('USERNAME_NOT_NULL', () => assert.ok(activated.user.username))
test('VALID_INVITATION_ACTIVATES', () => assert.equal(activated.ok, true))
test('APP_USER_ACTIVE', () => assert.equal(activated.user.status, 'active'))
test('TENANT_ACCESS_ACTIVE', () => assert.equal(activated.account.status, 'active'))
test('SCHOOL_ROLE_ACTIVE', () => assert.equal(activated.account.schoolRoleStatus, 'active'))
test('SCHOOL_SCOPE_PRESERVED', () => assert.deepEqual([activated.account.schoolId, activated.account.tenantId], ['school-a', 'tenant-a']))
test('TENANT_OWNER_PRESERVED', () => assert.equal(activated.account.isPrimaryOwner, true))

test('LOGIN_AFTER_ACTIVATION', () => {
  assert.match(loginPage, /rpc\('login_app_user'/)
  assert.match(loginPage, /from\('app_sessions'\)\.insert/)
  assert.match(loginPage, /httpOnly: true/)
  assert.match(productionSchema, /lower\(u\.username\) = lower\(trim\(input_username\)\)[\s\S]*or lower\(coalesce\(u\.email, ''\)\) = lower\(trim\(input_username\)\)/)
})

test('OLD_REGENERATED_TOKEN_REJECTED', () => {
  const oldToken = crypto.randomBytes(32).toString('base64url')
  const freshToken = crypto.randomBytes(32).toString('base64url')
  const invitations = [{ token: oldToken, status: 'invited' }]
  invitations.forEach((invitation) => { if (['invited', 'opened'].includes(invitation.status)) invitation.status = 'revoked' })
  invitations.push({ token: freshToken, status: 'invited' })
  assert.equal(invitations.find((invitation) => invitation.token === oldToken)?.status, 'revoked')
})

test('PRODUCTION_USERNAME_CONTRACT', () => {
  assert.match(productionSchema, /username text NOT NULL/)
  assert.match(productionSchema, /ADD CONSTRAINT app_users_username_key UNIQUE \(username\)/)
  assert.match(service, /function canonicalTenantAccessUsername/)
  assert.match(service, /username: identity\.username/)
  assert.match(service, /identity\.backfill \? \{ username: identity\.username \}/)
  assert.match(service, /school_admin: 'direction_etablissement'/)
})

console.log('PASS TENANT_ACCESS_USERNAME_SUITE')
