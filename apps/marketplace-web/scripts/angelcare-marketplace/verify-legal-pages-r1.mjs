#!/usr/bin/env node
// Offline behavior checks; no database writes, credentials, network or production build.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(app, 'package.json'));
const ts = require('typescript');
const base = path.join(app, 'angelcare-marketplace');
const compiled = new Map();
function moduleAt(file, overrides = {}) {
  const source = fs.readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true });
  assert.equal(output.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length || 0, 0, file);
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', output.outputText)(name => {
    if (name in overrides) return overrides[name];
    if (name === 'server-only') return {};
    if (name === 'react') return { cache: fn => fn };
    if (name.startsWith('.')) {
      const next = path.resolve(path.dirname(file), name + '.ts');
      if (!compiled.has(next)) compiled.set(next, moduleAt(next));
      return compiled.get(next);
    }
    throw Error('Unexpected dependency: ' + name);
  }, mod, mod.exports);
  return mod.exports;
}
const policy = moduleAt(path.join(base, 'compliance/legal-policy.ts'));
let checks = 0;
async function test(label, work) { await work(); checks++; console.log('[PASS]', label); }
const row = (more = {}) => ({ id: 'a', slug: 'legal/terms', locale: 'fr', territory_id: null, publication_state: 'published', ...more });
const select = (rows, kind = 'terms', locale = 'fr', territory = 'ma') => policy.selectLegalCandidate(kind, locale, territory, rows);
await test('Canonical published document is eligible', () => assert.equal(select([row()]).status, 'candidate'));
for (const state of ['draft', 'unpublished', 'archived', 'scheduled']) await test(`Explicit ${state} cannot inherit legacy published status`, () => assert.equal(select([row({ publication_state: state, status: 'published' })]).status, 'missing'));
await test('Legacy published record remains discoverable', () => assert.equal(select([row({ publication_state: undefined, status: 'published' })]).status, 'candidate'));
await test('Unpublished legacy record is excluded', () => assert.equal(select([row({ publication_state: undefined, status: 'draft' })]).status, 'missing'));
await test('Privacy aliases preserve their document identity', () => assert.equal(select([row({ slug: 'politique-de-confidentialite' })], 'privacy').status, 'candidate'));
await test('Terms do not consume privacy or sales conditions', () => assert.equal(select([row({ slug: 'cgv' }), row({ id: 'b', slug: 'legal/privacy' })]).status, 'missing'));
await test('Other territories are excluded', () => assert.equal(select([row({ territory_id: 'other' })]).status, 'missing'));
await test('Unknown territory does not widen scope', () => assert.equal(select([row({ territory_id: 'ma' })], 'terms', 'fr', null).status, 'missing'));
await test('Global published document remains available', () => assert.equal(select([row()], 'terms', 'fr', null).status, 'candidate'));
await test('Territory authority ranks above global', () => assert.equal(select([row(), row({ id: 'ma', territory_id: 'ma' })]).page.id, 'ma'));
await test('Canonical authority ranks above alias', () => assert.equal(select([row(), row({ id: 'alias', slug: 'terms' })]).page.id, 'a'));
await test('Equal published authorities are reported ambiguous', () => assert.equal(select([row(), row({ id: 'b' })]).status, 'ambiguous'));
await test('Multiple discovery associations do not duplicate candidates', () => assert.equal(select([row(), row()]).status, 'candidate'));
await test('Published locale and territory override mutable metadata', () => assert.equal(select([row({ locale: 'en', territory_id: 'other', published_locale: 'fr', published_territory_id: null })]).status, 'candidate'));
await test('Other language never silently becomes a match', () => assert.equal(select([row({ locale: 'en' })]).status, 'missing'));
let scenario, calls;
function database() {
  return { from(table) {
    const filters = [], chain = { select() { return chain; }, in(key, values) { filters.push([key, values]); return chain; }, eq(key, value) { filters.push([key, value]); return chain; }, order() { return chain; }, range(start, end) { chain.slice = [start, end]; return chain; }, maybeSingle() { return chain; }, then(resolve, reject) {
      calls.push({ table, filters });
      let result;
      if (scenario.failure) result = { data: null, error: { code: 'XX000', message: 'PRIVATE TEST ERROR' } };
      else if (table.endsWith('_territories')) result = { data: { id: 'ma' }, error: null };
      else if (table.endsWith('_revisions')) result = { data: scenario.revision || null, error: scenario.revisionError || null };
      else if (table.endsWith('_blocks')) result = { data: [{ id: 'mutable', content: {} }], error: null };
      else if (scenario.legacyColumn && filters.some(([k]) => k === 'published_slug')) result = { data: null, error: { code: '42703' } };
      else result = { data: (scenario.rows || []).filter(r => filters.every(([k, v]) => Array.isArray(v) ? v.includes(r[k]) : r[k] === v)).slice(...[chain.slice?.[0] || 0, (chain.slice?.[1] ?? 99) + 1]), error: null };
      return Promise.resolve(result).then(resolve, reject);
    } }; return chain;
  } };
}
const dbOverride = { '@/lib/supabase/server': { createServiceClient: async () => database() } };
class MarketplaceError extends Error { constructor(code, message) { super(message); this.code = code; } }
const shared = moduleAt(path.join(base, 'public-universe/repository.ts'), { ...dbOverride, '../server/errors': { MarketplaceError }, '../studio-universal/database-error': { marketplaceDatabaseError: () => new Error('SAFE DATABASE FAILURE') }, '../homepage-living-marketplace/world': { isLivingMarketplaceComponent: () => false } });
const resolver = moduleAt(path.join(base, 'compliance/legal-repository.ts'), { ...dbOverride, '../public-universe/repository': shared });
const reset = data => { scenario = data; calls = []; };
const revision = (page = {}) => ({ page_snapshot: { slug: 'legal/terms', locale: 'fr', ...page }, document: { blocks: [{ id: 'published-block', status: 'active', content: {} }] } });
await test('Exact immutable revision supplies legal body', async () => { reset({ revision: revision() }); const value = await shared.loadPublishedExperience(row({ published_revision_id: 'rev' }), { requirePublishedRevision: true }); assert.equal(value.blocks[0].id, 'published-block'); assert.deepEqual(calls.find(c => c.table.endsWith('_revisions')).filters, [['id', 'rev'], ['page_id', 'a']]); });
await test('Strict legal loader refuses mutable legacy blocks', async () => { reset({}); await assert.rejects(shared.loadPublishedExperience(row({ publication_state: undefined, status: 'published' }), { requirePublishedRevision: true })); assert(!calls.some(c => c.table.endsWith('_blocks'))); });
await test('Existing nonlegal legacy behavior remains unchanged', async () => { reset({}); const value = await shared.loadPublishedExperience(row({ publication_state: undefined, status: 'published' })); assert.equal(value.blocks[0].id, 'mutable'); });
await test('Modern broken publication never reads mutable blocks', async () => { reset({}); await assert.rejects(shared.loadPublishedExperience(row())); assert(!calls.some(c => c.table.endsWith('_blocks'))); });
await test('Published revision number remains supported', async () => { reset({ revision: revision() }); await shared.loadPublishedExperience(row({ published_version: 2 }), { requirePublishedRevision: true }); assert(calls.some(c => c.filters.some(([k,v]) => k === 'revision_number' && v === 2))); });
await test('Missing document is distinct from source outage', async () => { reset({ rows: [] }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).status, 'missing'); });
await test('French published fallback resolves for English', async () => { reset({ rows: [row({ published_revision_id: 'rev' })], revision: revision() }); const value = await resolver.resolvePublishedLegal('terms', 'en'); assert.equal(value.status, 'published'); assert.equal(value.sourceLocale, 'fr'); });
await test('Old schema candidate discovery remains supported', async () => { reset({ legacyColumn: true, rows: [row({ publication_state: undefined, status: 'published', published_revision_id: 'rev' })], revision: revision() }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).status, 'published'); });
const errors = [], originalError = console.error; console.error = (...items) => errors.push(items.join(' '));
try {
  await test('Database failure becomes unavailable, never empty catalogue or 404', async () => { reset({ failure: true }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).status, 'unavailable'); });
  await test('Unresolvable publication becomes unavailable', async () => { reset({ rows: [row()] }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).status, 'unavailable'); });
  await test('Ambiguous authority is never guessed', async () => { reset({ rows: [row(), row({ id: 'b' })] }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).reason, 'LEGAL_PUBLISHED_AUTHORITY_AMBIGUOUS'); });
  await test('Immutable document purpose is checked', async () => { reset({ rows: [row({ published_revision_id: 'rev' })], revision: revision({ slug: 'legal/privacy' }) }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).reason, 'LEGAL_PUBLISHED_SNAPSHOT_MISMATCH'); });
  await test('Immutable territory must match the selected authority', async () => { reset({ rows: [row({ published_revision_id: 'rev' })], revision: revision({ territory_id: 'other' }) }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).reason, 'LEGAL_PUBLISHED_SNAPSHOT_MISMATCH'); });
  await test('Empty or hidden-only document is unavailable', async () => { const r = revision(); r.document.blocks[0].status = 'hidden'; reset({ rows: [row({ published_revision_id: 'rev' })], revision: r }); assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).reason, 'LEGAL_PUBLISHED_DOCUMENT_EMPTY'); });
  await test('Operational logs omit raw database error details', () => assert(!errors.join(' ').includes('PRIVATE TEST ERROR')));
} finally { console.error = originalError; }
for (const kind of ['terms', 'privacy']) await test(`${kind} has a dedicated canonical dynamic route`, () => { const source = fs.readFileSync(path.join(app, 'app/angelcare-marketplace/[locale]/legal', kind, 'page.tsx'), 'utf8'); assert(source.includes("'force-dynamic'")); assert(source.includes(`kind="${kind}"`)); });
await test('Unavailable notices are not indexed as legal policies', () => { const source = fs.readFileSync(path.join(base, 'compliance/LegalPage.tsx'), 'utf8'); assert(source.includes('index: false')); assert(source.includes('copy.absent')); assert(source.includes('copy.error')); assert(source.includes('copy.fallback')); assert(source.includes('contentElement="div"')); });
await test('Candidate discovery reads past the second page', async () => {
  reset({ rows: [...Array.from({ length: 205 }, (_, i) => row({ id: 'alias-' + i, slug: 'terms' })), row({ published_revision_id: 'rev' })], revision: revision() });
  assert.equal((await resolver.resolvePublishedLegal('terms', 'fr')).status, 'published');
  assert(calls.filter(c => c.filters.some(([k]) => k === 'slug')).length >= 3);
});
const jsx = require('react/jsx-runtime'), React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
let publicResult;
const ui = moduleAt(path.join(base, 'compliance/LegalPage.tsx'), {
  'react/jsx-runtime': jsx, 'next/link': { default: props => React.createElement('a', props) },
  './legal.module.css': { __esModule: true, default: {} },
  './legal-repository': { resolvePublishedLegal: async () => publicResult },
  '../public-universe/components/GlobalPublicShell': { GlobalPublicShell: props => props.children },
  '../public-universe/components/PublicPageRenderer': { PublicPageRenderer: () => React.createElement('p', null, 'APPROVED BODY') },
});
for (const status of ['missing', 'unavailable']) await test(`${status} renders an honest localized notice and no body`, async () => {
  publicResult = { status, reason: 'TEST' };
  for (const locale of ['fr', 'en', 'ar']) {
    const html = renderToStaticMarkup(await ui.AngelCareLegalPage({ kind: 'privacy', locale }));
    assert(html.includes(`data-ac-legal-state="${status}"`)); assert(!html.includes('APPROVED BODY')); assert(html.includes(`/angelcare-marketplace/${locale}/contact`));
    assert.equal((await ui.legalMetadata('privacy', locale)).robots.index, false);
  }
});
await test('Published fallback renders the approved body and language disclosure', async () => {
  publicResult = { status: 'published', sourceLocale: 'fr', experience: { page: { title: 'Approved terms' }, navigation: [], blocks: [] } };
  const html = renderToStaticMarkup(await ui.AngelCareLegalPage({ kind: 'terms', locale: 'en' }));
  assert(html.includes('APPROVED BODY')); assert(html.includes('French version')); assert(html.includes('lang="fr"'));
  assert.equal((await ui.legalMetadata('terms', 'en')).alternates.canonical, '/angelcare-marketplace/en/legal/terms');
});
for (const kind of ['terms', 'privacy']) await test(`${kind} route accepts all supported locales and rejects invalid locale`, async () => {
  const route = moduleAt(path.join(app, 'app/angelcare-marketplace/[locale]/legal', kind, 'page.tsx'), {
    'react/jsx-runtime': jsx, 'next/navigation': { notFound() { throw Error('NOT_FOUND'); } },
    '@/angelcare-marketplace/compliance/LegalPage': { AngelCareLegalPage: () => null, legalMetadata: async (kind, locale) => ({ kind, locale }) },
  });
  for (const locale of ['fr', 'en', 'ar']) { const props = { params: Promise.resolve({ locale }) }; assert.equal((await route.default(props)).props.locale, locale); assert.equal((await route.generateMetadata(props)).kind, kind); }
  await assert.rejects(route.default({ params: Promise.resolve({ locale: 'xx' }) }), /NOT_FOUND/);
});
console.log('LEGAL_BEHAVIOR_CHECKS=' + checks);
