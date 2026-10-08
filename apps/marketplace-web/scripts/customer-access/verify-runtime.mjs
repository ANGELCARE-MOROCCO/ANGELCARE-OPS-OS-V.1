import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
const root = path.resolve(process.argv[2] || process.cwd())
const require = createRequire(path.join(root, 'package.json')), ts = require('typescript'), results = []
function load(relative, mocks = {}) {
 const full = path.resolve(root, relative)
 const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
 const module = { exports: {} }
 const resolve = key => { if (key in mocks) return mocks[key]; if (key === 'react/jsx-runtime') return require(key); if (key.endsWith('.css')) return { default: {} }; if (key.startsWith('.')) { const candidate = path.resolve(path.dirname(full), key); return load(path.relative(root, fs.existsSync(candidate + '.ts') ? candidate + '.ts' : candidate + '.tsx'), mocks) } throw new Error('Unmocked dependency: ' + key) }
 vm.runInThisContext(`(function(require,module,exports,process,Response,URL,URLSearchParams){${code}\n})`, { filename: full })(resolve, module, module.exports, process, Response, URL, URLSearchParams)
 return module.exports
}
async function test(name, fn) { await fn(); results.push(name); console.log('PASS', name) }
const nav = load('angelcare-marketplace/customer-commerce/auth-navigation.ts'), fallback = '/angelcare-marketplace/fr/account'
for (const target of ['https://evil.test/x', '//evil.test/x', '/\\evil.test', '/angelcare-marketplace/fr/../../admin', '/angelcare-marketplace/fr/auth/login', '/angelcare-marketplace/en/admin', '/angelcare-marketplace/fr/%252f%252fevil.test', '/angelcare-marketplace/fr/%2e%2e/%2e%2e/login', '/angelcare-marketplace/fr/\nfoo', '/angelcare-marketplace/fr/%255cadmin', '/angelcare-marketplace/fr/auth%2flogin']) await test('REJECT_RETURN_' + results.length, () => assert.equal(nav.customerReturnTo(target, 'fr'), fallback))
const familyTarget = '/angelcare-marketplace/fr/family/request?need=non-medical-support-service'
await test('KEEP_FAMILY_NEED', () => assert.equal(nav.customerReturnTo(familyTarget, 'fr'), familyTarget))
await test('KEEP_CHECKOUT_ENCODED_CONFIG', () => assert.equal(nav.customerReturnTo('/angelcare-marketplace/fr/checkout?config=blue%20box', 'fr'), '/angelcare-marketplace/fr/checkout?config=blue%20box'))
await test('TABS_AND_LOCALE_KEEP_RETURN', () => assert.equal(new URL(nav.customerAuthHref('ar', 'register', nav.customerLocaleReturnTo(familyTarget, 'ar')), 'https://local').searchParams.get('returnTo'), familyTarget.replace('/fr/', '/ar/')))
await test('PASSWORD_POLICY_ALL_FOUR', () => { assert.deepEqual([...nav.passwordChecks('StrongPass12')], [true, true, true, true]); assert.equal(nav.passwordChecks('weak').every(Boolean), false) })

const initialAccount = () => ({ id: 'account-1', auth_user_id: 'user-1', public_reference: 'AC-1', account_kind: 'family', status: 'active', display_name: 'TEST CUSTOMER', email: 'test@example.invalid', preferred_locale: 'fr', family_account_id: 'family-1', email_verified_at: '2026-10-07T00:00:00Z' })
function fixture() {
 const state = { account: initialAccount(), user: { id: 'user-1', email: 'test@example.invalid', email_confirmed_at: '2026-10-07T00:00:00Z', identities: [{}], user_metadata: { locale: 'fr' } }, session: null, operations: [], providerError: null, dbError: null }
 const db = { from(table) {
   const op = { table, kind: 'read', patch: null, filters: [] }; state.operations.push(op)
   const q = { select() { return q }, eq(k, v) { op.filters.push([k, v]); return q }, in(k, v) { op.filters.push([k, v]); return q }, update(patch) { op.kind = 'update'; op.patch = patch; return q }, insert(patch) { op.kind = 'insert'; op.patch = patch; return q },
    async maybeSingle() { return result() }, async single() { return result() }, then(yes, no) { return Promise.resolve(result()).then(yes, no) } }
   function result() { if (state.dbError) return { data: null, error: state.dbError }; let row = state.account; if (op.filters.some(([k, v]) => Array.isArray(v) && !v.includes(row?.[k]))) return { data: null, error: null }; if (op.kind === 'insert') row = state.account = { ...initialAccount(), ...op.patch }; if (op.kind === 'update' && row) row = state.account = { ...row, ...op.patch }; return { data: row, error: null } }
   return q
 }, rpc: async () => ({ data: { conversions: 1, journeys: 1 }, error: null }) }
 const auth = {
   getUser: async () => ({ data: { user: state.user }, error: state.providerError }),
   signUp: async input => { state.signupInput = input; return { data: { user: state.user, session: state.session }, error: state.providerError } },
   signInWithPassword: async () => ({ data: { user: state.user }, error: state.providerError }),
   signOut: async input => { state.signedOut = input || true; return { error: null } },
   updateUser: async input => { state.passwordInput = input; return { error: state.providerError } },
   exchangeCodeForSession: async code => { state.code = code; return { data: { user: state.user }, error: state.providerError } },
   verifyOtp: async input => { state.otp = input; return { data: { user: state.user }, error: state.providerError } },
   setSession: async input => { state.sessionInput = input; return { error: state.providerError } },
 }
 const mocks = { '@/lib/supabase/server': { createServiceClient: async () => db, createUserClient: async () => ({ auth }) }, 'next/navigation': { redirect: target => { throw new Error('REDIRECT:' + target) } }, 'next/headers': { headers: async () => new Headers({ 'x-angelcare-customer-path': '/angelcare-marketplace/fr/account/orders' }), cookies: async () => ({ get: () => undefined }) } }
 const api = load('angelcare-marketplace/customer-commerce/customer-auth.ts', mocks)
 return { state, mocks, api }
}
await test('ANONYMOUS_CONTEXT_DENIED', async () => { const f = fixture(); f.state.user = null; assert.equal(await f.api.getCustomerContext(), null) })
await test('UNCONFIRMED_CONTEXT_DENIED', async () => { const f = fixture(); f.state.user.email_confirmed_at = null; assert.equal(await f.api.getCustomerContext(), null) })
await test('CLOSED_CONTEXT_NO_FAMILY_PROVISION', async () => { const f = fixture(); f.state.account.status = 'closed'; f.state.account.family_account_id = null; assert.equal(await f.api.getCustomerContext(), null); assert.ok(f.state.operations.every(op => op.kind === 'read')) })
await test('ACCOUNT_RETURN_PATH_RESTORED', async () => { const f = fixture(); f.state.user = null; await assert.rejects(f.api.requireCustomerPageContext('fr'), /returnTo=%2Fangelcare-marketplace%2Ffr%2Faccount%2Forders/) })
await test('CONSENT_ENFORCED_SERVER_SIDE', async () => { const f = fixture(); await assert.rejects(f.api.registerCustomer({ accepted: false }), /accord/); assert.equal(f.state.signupInput, undefined) })
await test('DUPLICATE_OBFUSCATED_USER_NEVER_WRITES', async () => { const f = fixture(); f.state.user.identities = []; const result = await f.api.registerCustomer({ fullName: 'TEST', email: 'test@example.invalid', password: 'StrongPass12', accepted: true }); assert.equal(result.verificationRequired, true); assert.equal(f.state.operations.length, 0) })
await test('DUPLICATE_EXISTING_PROFILE_NEVER_OVERWRITES', async () => { const f = fixture(); await f.api.registerCustomer({ fullName: 'ATTEMPT', email: 'test@example.invalid', password: 'StrongPass12', accepted: true }); assert.ok(f.state.operations.every(op => op.kind === 'read')); assert.equal(f.state.account.display_name, 'TEST CUSTOMER') })
await test('REGISTRATION_SAVES_CONSENT_AND_SAFE_RETURN', async () => { const f = fixture(); f.state.account = null; const result = await f.api.registerCustomer({ fullName: 'TEST', email: 'test@example.invalid', password: 'StrongPass12', accepted: true, locale: 'fr', destination: familyTarget }); assert.equal(result.verificationRequired, true); assert.equal(f.state.signupInput.options.data.marketplace_return_to, familyTarget); assert.equal(f.state.signupInput.options.data.marketplace_customer_consent.marketing, false); assert.ok(f.state.operations.some(op => op.kind === 'insert')) })
await test('SUSPENDED_LOGIN_CLEARS_LOCAL_SESSION', async () => { const f = fixture(); f.state.account.status = 'suspended'; await assert.rejects(f.api.loginCustomer({ email: 'test@example.invalid', password: 'pw' }), /compte/); assert.deepEqual(f.state.signedOut, { scope: 'local' }) })
await test('PASSWORD_UPDATE_REQUIRES_CUSTOMER', async () => { const f = fixture(); f.state.user = null; await assert.rejects(f.api.updateCustomerPassword('StrongPass12'), /Connectez/); assert.equal(f.state.passwordInput, undefined) })
await test('PASSWORD_UPDATE_VALIDATES_POLICY', async () => { const f = fixture(); await assert.rejects(f.api.updateCustomerPassword('weak'), /10 caractères/); assert.equal(f.state.passwordInput, undefined) })
await test('PASSWORD_UPDATE_WORKS_WITH_VERIFIED_CUSTOMER', async () => { const f = fixture(); await f.api.updateCustomerPassword('StrongPass12'); assert.deepEqual(f.state.passwordInput, { password: 'StrongPass12' }) })
await test('CONFIRMED_CONTEXT_SYNCS_PENDING_PROFILE', async () => { const f = fixture(); f.state.account.status = 'pending_verification'; f.state.account.email_verified_at = null; const context = await f.api.getCustomerContext(); assert.equal(context.account.status, 'active'); assert.ok(context.account.email_verified_at) })

for (const [name, query, providerError, status, expected] of [
 ['CALLBACK_PKCE_MAGIC_RETURN', 'code=TEST&flow=magic&locale=fr&returnTo=' + encodeURIComponent(familyTarget), null, 'active', familyTarget],
 ['CALLBACK_RECOVERY_TO_RESET', 'token_hash=TEST&type=recovery&locale=fr&returnTo=' + encodeURIComponent(familyTarget), null, 'active', '/auth/reset?'],
 ['CALLBACK_INVALID_CODE_NO_SUCCESS', 'code=TEST&flow=signup', new Error('Invalid code'), 'active', 'state=invalid'],
 ['CALLBACK_CLOSED_ACCOUNT_NOT_REOPENED', 'code=TEST&flow=signup', null, 'closed', 'state=pending'],
 ['CALLBACK_MISSING_TOKEN_INVALID', 'flow=signup', null, 'active', 'state=invalid'],
 ['CALLBACK_UNSUPPORTED_TOKEN_TYPE', 'token_hash=TEST&type=sms', null, 'active', 'state=invalid'],
]) await test(name, async () => { const f = fixture(); f.state.providerError = providerError; f.state.account.status = status; f.mocks['./customer-auth'] = { getCustomerContext: async () => ({ account: f.state.account }), claimGuestCommerce: async () => ({}) }; const links = load('angelcare-marketplace/customer-commerce/customer-auth-links.ts', f.mocks); const response = await links.handleCustomerConfirmation(new Request('https://my.angelcarehub.com/angelcare-marketplace/auth/callback?' + query)); assert.equal(response.status, 303); assert.ok(response.headers.get('location').includes(expected)); assert.equal(response.headers.get('cache-control'), 'private, no-store'); if (status === 'closed') assert.equal(f.state.account.status, 'closed') })
for (const [name, state, user, account, expected] of [
 ['VERIFIED_QUERY_ALONE_IS_NOT_PROOF', 'confirmed', null, null, 'invalid'],
 ['VERIFIED_INVALID_REMAINS_INVALID', 'invalid', { email_confirmed_at: 'date' }, {}, 'invalid'],
 ['VERIFIED_NO_CONFIRMED_EMAIL_DENIED', 'confirmed', { email_confirmed_at: null }, {}, 'invalid'],
 ['VERIFIED_MISSING_PROFILE_IS_PENDING', 'confirmed', { email_confirmed_at: 'date' }, null, 'pending'],
 ['VERIFIED_AUTH_AND_PROFILE_READY', 'confirmed', { email_confirmed_at: 'date', user_metadata: {} }, {}, 'confirmed'],
]) await test(name, async () => { const mocks = { 'next/navigation': { notFound: () => { throw new Error('notFound') }, redirect: () => { throw new Error('redirect') } }, '@/lib/supabase/server': { createUserClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }) }, '@/angelcare-marketplace/customer-commerce/customer-auth': { getCustomerContext: async () => account }, '@/angelcare-marketplace/customer-commerce/auth-navigation': nav, '@/angelcare-marketplace/customer-commerce/components/CustomerVerifiedExperience': { CustomerVerifiedExperience: () => null } }; const page = load('app/angelcare-marketplace/[locale]/auth/verified/page.tsx', mocks); const result = await page.default({ params: Promise.resolve({ locale: 'fr' }), searchParams: Promise.resolve({ state }) }); assert.equal(result.props.state, expected) })
await test('CUSTOMER_JOURNEYS_USE_OWNERSHIP_NOT_TENANT', async () => {
 const operations = []
 const db = { from(table) { const op = { table, filters: [], or: '' }; operations.push(op); const q = { select() { return q }, order() { return q }, eq(key, value) { op.filters.push([key, value]); return q }, or(value) { op.or = value; return q }, async maybeSingle() { return { data: { id: table.includes('family') ? 'family-1' : 'account-1' }, error: null } }, then(yes, no) { return Promise.resolve({ data: [], error: null }).then(yes, no) } }; return q } }
 const repository = load('angelcare-marketplace/journey-control/repository.ts', { '@/lib/supabase/server': { createServiceClient: async () => db }, '../audit/write-audit': { writeMarketplaceAudit: async () => {} } })
 await repository.listCustomerJourneys({ actor: { id: 'user-1', sourceRole: 'marketplace_customer' }, tenantId: 'tenant-shared' })
 const read = operations.find(op => op.table === 'angelcare_marketplace_journeys')
 assert.equal(read.filters.some(([key]) => key === 'tenant_id'), false)
 assert.equal(read.or, 'owner_user_id.eq.user-1,family_account_id.eq.family-1,customer_account_id.eq.account-1')
})
await test('CUSTOMER_JOURNEY_API_ACCEPTS_CUSTOMER_WITHOUT_ADMIN_AUTH', async () => {
 const context = { actor: { id: 'user-1', sourceRole: 'marketplace_customer' } }
 const handlers = load('angelcare-marketplace/journey-control/api-handlers.ts', { '../auth/context': { requireMarketplaceApiContext: async () => { throw new Error('Platform auth should not run') } }, '../customer-commerce/customer-auth': { getCustomerContext: async () => ({ marketplace: context }) }, '../server/request': { requestId: () => 'TEST', apiSuccess: data => ({ data }), apiFailure: error => { throw error } }, './repository': { getCustomerJourney: async (id, value) => { assert.equal(value, context); return { id } } } })
 assert.equal((await handlers.handleCustomerJourney(new Request('https://local'), 'owned-journey')).data.id, 'owned-journey')
})
await test('JOURNEY_ADMIN_API_RETAINS_PERMISSION_GUARD', async () => {
 let permission = ''
 const handlers = load('angelcare-marketplace/journey-control/api-handlers.ts', { '../auth/context': { requireMarketplaceApiContext: async value => { permission = value; return {} } }, '../customer-commerce/customer-auth': { getCustomerContext: async () => { throw new Error('Customer must not authorize admin') } }, '../server/request': { requestId: () => 'TEST', apiSuccess: data => ({ data }), apiFailure: error => { throw error } }, './repository': { getJourneyAdminSummary: async () => ({}) } })
 await handlers.handleAdminSummary(new Request('https://local'))
 assert.equal(permission, 'marketplace.journeys.view')
})
await test('SESSION_PROXY_REFRESH_COOKIE_AND_TRUSTED_RETURN_HEADER', async () => {
 const jar = new Map([['sb-test-auth-token', 'expired']])
 const next = ({ request }) => ({ forwarded: request.headers, headers: new Headers(), cookies: { entries: [], set(name, value, options) { this.entries.push({ name, value, options }) } } })
 const createServerClient = (_, __, { cookies }) => ({ auth: { getUser: async () => { cookies.setAll([{ name: 'sb-test-auth-token', value: 'fresh', options: { httpOnly: true } }]); return { data: { user: null }, error: null } } } })
 const proxy = load('angelcare-marketplace/customer-commerce/customer-session-proxy.ts', { '@supabase/ssr': { createServerClient }, 'next/server': { NextResponse: { next } }, '@/lib/supabase/env': { getSupabaseEnv: () => ({ url: 'https://supabase.invalid', anonKey: 'TEST' }) } })
 const response = await proxy.refreshCustomerSession({ headers: new Headers({ 'x-angelcare-customer-path': 'https://evil.invalid' }), nextUrl: new URL('https://local/angelcare-marketplace/fr/account/orders?tab=current'), cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), set: (name, value) => jar.set(name, value) } })
 assert.equal(response.cookies.entries[0].value, 'fresh')
 assert.equal(response.forwarded.get('x-angelcare-customer-path'), '/angelcare-marketplace/fr/account/orders?tab=current')
 assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0')
})
for (const [name, origin, user, suspended, expected] of [
 ['SESSION_BRIDGE_REJECTS_CROSS_ORIGIN', 'https://evil.invalid', true, false, 403],
 ['SESSION_BRIDGE_REJECTS_UNVERIFIED_TOKEN_USER', 'https://my.angelcarehub.com', false, false, 401],
 ['SESSION_BRIDGE_REJECTS_SUSPENDED_CUSTOMER', 'https://my.angelcarehub.com', true, true, 401],
 ['SESSION_BRIDGE_VERIFIES_CUSTOMER', 'https://my.angelcarehub.com', true, false, 200],
]) await test(name, async () => {
 const f = fixture(); if (!user) f.state.user = null; if (suspended) f.state.account.status = 'suspended'
 f.mocks['./customer-auth'] = f.api
 f.mocks['../server/request'] = { requestId: () => 'TEST', parseJsonObject: request => request.json(), apiSuccess: data => new Response(JSON.stringify({ data }), { status: 200 }), apiFailure: error => new Response(JSON.stringify({ error: error.code }), { status: error.status || 500 }) }
 const api = load('angelcare-marketplace/customer-commerce/customer-access-api.ts', f.mocks)
 const response = await api.handleCustomerSessionBridge(new Request('https://my.angelcarehub.com/api/angelcare-marketplace/customer/auth/session', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ accessToken: 'TEST-ACCESS', refreshToken: 'TEST-REFRESH' }) }))
 assert.equal(response.status, expected)
 if (expected === 403) assert.equal(f.state.sessionInput, undefined)
 if (expected === 401) assert.deepEqual(f.state.signedOut, { scope: 'local' })
})
console.log(`CUSTOMER_ACCESS_RUNTIME=${results.length}/${results.length} PASS`)
