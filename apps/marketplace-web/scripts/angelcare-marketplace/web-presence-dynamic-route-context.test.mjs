import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test, { mock } from 'node:test'

const KNOWN_VERSION_ID = '0304edc5-f3c4-482f-a930-2674b73a51c9'
const appRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const moduleUrl = (relativePath) => pathToFileURL(join(appRoot, relativePath)).href
const calls = { patch: [], validate: [], publish: [], create: 0 }

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) return nextResolve(moduleUrl(`${specifier.slice(2)}.ts`), context)
    if (specifier === 'next/server') return nextResolve('next/server.js', context)
    if (specifier.startsWith('./') && context.parentURL?.endsWith('.ts')) return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context)
    return nextResolve(specifier, context)
  },
})

const marketplaceContext = { actor: { id: 'operator-user' } }
mock.module(moduleUrl('angelcare-marketplace/auth/context.ts'), { exports: {
  hasMarketplacePermission: () => true,
  requireMarketplaceApiContext: async () => marketplaceContext,
} })
mock.module(moduleUrl('angelcare-marketplace/server/request.ts'), { exports: {
  parseJsonObject: async (request) => request.json(),
  requestId: () => 'request-web-presence-context',
} })
mock.module(moduleUrl('angelcare-marketplace/web-presence/verification.ts'), { exports: {
  verifyLiveWebPresence: async () => ({}),
} })
mock.module(moduleUrl('lib/supabase/server.ts'), { exports: {
  createServiceClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { scope_key: 'MARKETPLACE' }, error: null }) }),
      }),
    }),
  }),
} })

const draftVersion = {
  id: KNOWN_VERSION_ID,
  profileId: 'marketplace-profile',
  versionNumber: 1,
  lifecycleState: 'DRAFT',
  validationResult: null,
}
const validatedVersion = {
  ...draftVersion,
  lifecycleState: 'VALIDATED',
  validationResult: { valid: true, blockers: [], warnings: [] },
}
const snapshot = {
  profile: { scopeKey: 'MARKETPLACE' },
  affectedRoutes: ['/angelcare-marketplace'],
}

mock.module(moduleUrl('angelcare-marketplace/web-presence/repository.ts'), { exports: {
  createWebPresenceDraft: async () => { calls.create += 1; return draftVersion },
  getWebPresenceSnapshot: async () => snapshot,
  publishWebPresence: async (versionId) => {
    calls.publish.push(versionId)
    return { versionId, revision: 1, result: 'PUBLISHED', lifecycleState: 'PUBLISHED' }
  },
  rollbackWebPresence: async () => ({}),
  updateWebPresenceDraft: async (versionId) => {
    calls.patch.push(versionId)
    return draftVersion
  },
  validateWebPresenceDraft: async (versionId) => {
    calls.validate.push(versionId)
    return validatedVersion
  },
  webPresenceHistory: async () => [],
} })

const { patchDraft, publishDraft, validateDraft } = await import('../../angelcare-marketplace/web-presence/api.ts')
const routeContext = () => ({ params: Promise.resolve({ versionId: KNOWN_VERSION_ID }) })
const request = (payload) => new Request('https://my.angelcarehub.com/api/angelcare-marketplace/admin/web-presence/drafts/' + KNOWN_VERSION_ID, {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://my.angelcarehub.com' },
  body: JSON.stringify(payload),
})

test('Next.js route context propagates the existing version ID through save, validate and publish', async () => {
  const patchResponse = await patchDraft(request({ expectedRevision: 1, configuration: {}, changeSummary: 'Save Version 1', scope: 'MARKETPLACE' }), routeContext())
  const patchBody = await patchResponse.json()
  assert.equal(patchResponse.status, 200)
  assert.equal(patchBody.data.versionId, KNOWN_VERSION_ID)
  assert.equal(patchBody.data.revision, 1)
  assert.equal(patchBody.data.result, 'DRAFT_SAVED')

  const validateResponse = await validateDraft(request({}), routeContext())
  const validateBody = await validateResponse.json()
  assert.equal(validateResponse.status, 200)
  assert.equal(validateBody.data.versionId, KNOWN_VERSION_ID)
  assert.equal(validateBody.data.revision, 1)
  assert.equal(validateBody.data.result, 'VALIDATED')

  const publishResponse = await publishDraft(request({ expectedCurrentRevision: 0 }), routeContext())
  const publishBody = await publishResponse.json()
  assert.equal(publishResponse.status, 200)
  assert.equal(publishBody.data.versionId, KNOWN_VERSION_ID)
  assert.equal(publishBody.data.revision, 1)
  assert.equal(publishBody.data.result, 'PUBLISHED')

  assert.deepEqual(calls.patch, [KNOWN_VERSION_ID])
  assert.deepEqual(calls.validate, [KNOWN_VERSION_ID])
  assert.deepEqual(calls.publish, [KNOWN_VERSION_ID])
  assert.equal(calls.create, 0)
  console.log('WEB_PRESENCE_DYNAMIC_CONTEXT=PASS')
  console.log('PATCH_VERSION_ID_PROPAGATION=PASS')
  console.log('VALIDATE_VERSION_ID_PROPAGATION=PASS')
  console.log('PUBLISH_VERSION_ID_PROPAGATION=PASS')
  console.log('NEXTJS_CONTEXT_SHAPE_TEST=PASS')
  console.log('EXISTING_VERSION_1_PRESERVED=PASS')
  console.log('SAVE_DOES_NOT_CREATE_VERSION_2=PASS')
  console.log('DRAFT_SAVE=PASS')
  console.log('DRAFT_VALIDATE=PASS')
  console.log('VALIDATED_PUBLISH=PASS')
})

test('invalid dynamic route IDs fail before repository access', async () => {
  const before = { patch: calls.patch.length, validate: calls.validate.length, publish: calls.publish.length }
  const invalidContext = () => ({ params: Promise.resolve({ versionId: '' }) })
  const responses = await Promise.all([
    patchDraft(request({ expectedRevision: 1, configuration: {}, scope: 'MARKETPLACE' }), invalidContext()),
    validateDraft(request({}), invalidContext()),
    publishDraft(request({ expectedCurrentRevision: 0 }), invalidContext()),
  ])
  assert.deepEqual(responses.map((response) => response.status), [400, 400, 400])
  assert.deepEqual({ patch: calls.patch.length, validate: calls.validate.length, publish: calls.publish.length }, before)
})

test('all dynamic wrappers and shared handlers retain the Next.js context contract', async () => {
  const api = await readFile(join(appRoot, 'angelcare-marketplace/web-presence/api.ts'), 'utf8')
  assert.match(api, /type WebPresenceVersionRouteContext = \{\s*params: Promise<\{ versionId: string \}>\s*\}/)
  for (const handler of ['patchDraft', 'validateDraft', 'publishDraft']) {
    assert.match(api, new RegExp(`function ${handler}\\(request:Request,context:WebPresenceVersionRouteContext\\)`))
  }
  assert.doesNotMatch(api, /(?:patchDraft|validateDraft|publishDraft)\(request:Request,params:Promise/)
  const wrappers = [
    ['app/api/angelcare-marketplace/admin/web-presence/drafts/[versionId]/route.ts', 'export const PATCH=patchDraft'],
    ['app/api/angelcare-marketplace/admin/web-presence/drafts/[versionId]/validate/route.ts', 'export const POST=validateDraft'],
    ['app/api/angelcare-marketplace/admin/web-presence/drafts/[versionId]/publish/route.ts', 'export const POST=publishDraft'],
  ]
  for (const [path, marker] of wrappers) assert.match(await readFile(join(appRoot, path), 'utf8'), new RegExp(marker))
  console.log('DYNAMIC_ROUTE_STATIC_CONTRACT=PASS')
})
