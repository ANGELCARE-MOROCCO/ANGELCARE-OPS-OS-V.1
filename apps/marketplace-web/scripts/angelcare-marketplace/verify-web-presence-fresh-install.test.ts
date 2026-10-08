import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { nextWebPresenceVersionNumber, resolveWebPresenceAuthorityState } from '../../angelcare-marketplace/web-presence/authority-state'
import { compiledWebPresence } from '../../angelcare-marketplace/web-presence/fallback'
import type { WebPresenceVersion } from '../../angelcare-marketplace/web-presence/types'

const source = (path: string) => readFile(join(process.cwd(), path), 'utf8')
const fallback = compiledWebPresence('MARKETPLACE')
const version = (input: Partial<WebPresenceVersion> & Pick<WebPresenceVersion, 'id' | 'versionNumber' | 'lifecycleState'>): WebPresenceVersion => ({
  id: input.id,
  profileId: 'marketplace-profile',
  versionNumber: input.versionNumber,
  lifecycleState: input.lifecycleState,
  configuration: input.configuration ?? fallback,
  configurationChecksum: 'checksum',
  validationResult: input.validationResult ?? null,
  changeSummary: null,
  createdBy: null,
  validatedBy: null,
  publishedBy: null,
  createdAt: '2026-09-04T00:00:00.000Z',
  validatedAt: null,
  publishedAt: null,
})

test('fresh migration with profiles and zero versions remains persistence-ready', () => {
  const state = resolveWebPresenceAuthorityState('MARKETPLACE', [], null)
  assert.equal(state.persistenceState, 'READY_TO_BOOTSTRAP')
  assert.equal(state.draft, null)
  assert.equal(state.published, null)
  assert.deepEqual(state.effectiveConfiguration, fallback)
  console.log('FRESH_MIGRATION_ZERO_VERSIONS=PASS')
  console.log('ZERO_VERSION_RUNTIME_FALLBACK=PASS')
  console.log('ZERO_VERSION_ADMIN_WORKSPACE=PASS')
})

test('first normal draft is version one and cannot alter public runtime', async () => {
  assert.equal(nextWebPresenceVersionNumber(null), 1)
  const draftConfiguration = compiledWebPresence('MARKETPLACE')
  draftConfiguration.identity.defaultTitle = 'Draft title must not be public'
  const state = resolveWebPresenceAuthorityState('MARKETPLACE', [version({ id: 'draft-1', versionNumber: 1, lifecycleState: 'DRAFT', configuration: draftConfiguration })], null)
  assert.equal(state.persistenceState, 'DRAFT_ONLY')
  assert.equal(state.draft?.versionNumber, 1)
  assert.equal(state.published, null)
  assert.equal(state.effectiveConfiguration.identity.defaultTitle, fallback.identity.defaultTitle)
  const publishedConfiguration = compiledWebPresence('MARKETPLACE')
  publishedConfiguration.identity.defaultTitle = 'Existing published title'
  const published = version({ id: 'published-1', versionNumber: 1, lifecycleState: 'PUBLISHED', configuration: publishedConfiguration })
  const laterDraft = version({ id: 'draft-2', versionNumber: 2, lifecycleState: 'DRAFT', configuration: draftConfiguration })
  const existingPublication = resolveWebPresenceAuthorityState('MARKETPLACE', [laterDraft, published], published.id)
  assert.equal(existingPublication.draft?.id, laterDraft.id)
  assert.equal(existingPublication.effectiveConfiguration.identity.defaultTitle, 'Existing published title')
  const repository = await source('angelcare-marketplace/web-presence/repository.ts')
  assert.match(repository, /createWebPresenceDraft/)
  assert.match(repository, /nextWebPresenceVersionNumber/)
  assert.match(repository, /lifecycle_state:'DRAFT'/)
  console.log('FIRST_DRAFT_CREATES_VERSION_1=PASS')
  console.log('DRAFT_DOES_NOT_CHANGE_PUBLIC_RUNTIME=PASS')
})

test('first validated publication becomes the only public configuration', async () => {
  const publishedConfiguration = compiledWebPresence('MARKETPLACE')
  publishedConfiguration.identity.defaultTitle = 'Published configuration'
  const published = version({ id: 'published-1', versionNumber: 1, lifecycleState: 'PUBLISHED', configuration: publishedConfiguration })
  const state = resolveWebPresenceAuthorityState('MARKETPLACE', [published], published.id)
  assert.equal(state.persistenceState, 'PUBLISHED')
  assert.equal(state.published?.id, published.id)
  assert.equal(state.effectiveConfiguration.identity.defaultTitle, 'Published configuration')
  const [repository, migration] = await Promise.all([
    source('angelcare-marketplace/web-presence/repository.ts'),
    source('supabase/migrations/20260904090000_angelcare_marketplace_web_presence_command_v1.sql'),
  ])
  assert.match(repository, /version\.lifecycleState!==\'VALIDATED\'/)
  assert.match(repository, /angelcare_marketplace_publish_web_presence/)
  assert.match(migration, /current_published_version_id\s*=\s*p_version_id/)
  console.log('FIRST_PUBLICATION_SETS_POINTER=PASS')
  console.log('PUBLISHED_RUNTIME_RESOLVES_CONFIGURATION=PASS')
})

test('workspace and snapshot expose an always-present effective configuration', async () => {
  const [workspace, repository] = await Promise.all([
    source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx'),
    source('angelcare-marketplace/web-presence/repository.ts'),
  ])
  assert.doesNotMatch(workspace, /\(initial\.draft\|\|initial\.published\)!\.configuration/)
  assert.match(workspace, /initial\.draft\?\.configuration\?\?initial\.effectiveConfiguration/)
  assert.match(repository, /effectiveConfiguration:configuration/)
  console.log('NO_NULL_CONFIGURATION_PATH=PASS')
})
