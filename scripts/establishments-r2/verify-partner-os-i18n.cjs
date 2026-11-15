/* Exercises the actual shared renderers and native enquiry contract. No API writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const appRequire = createRequire(path.join(root, 'apps/marketplace-web/package.json'));
const ts = appRequire('typescript');
const React = appRequire('react');
const { renderToStaticMarkup: render } = appRequire('react-dom/server');
const world = path.join(root, 'apps/marketplace-web/angelcare-marketplace/establishments-world');
const original = Object.fromEntries(['.ts', '.tsx', '.css'].map(key => [key, require.extensions[key]]));
function compile(module, file) {
  module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, file);
}
require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
require.extensions['.css'] = module => module.exports = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
const { CHAPTERS, MODULES, FAQ, EMPTY_PARTNER, EMPTY_PRESENTATION, restorePartner, restorePresentation, toggleModule, partnerBrief } = require(path.join(world, 'partner/content.ts'));
const { partnerText, countText } = require(path.join(world, 'partner/Locale.tsx'));
const { partnerLocaleHref } = require(path.join(world, 'partner/locale-navigation.ts'));
const { PartnerLocaleLinks } = require(path.join(world, 'partner/LocaleLinks.tsx'));
const { EstablishmentsExperience } = require(path.join(world, 'Experience.tsx'));
const { offerSelection, requestBrief, enquiryMessage } = require(path.join(world, 'model.ts'));
const { EMPTY_ENQUIRY, enquiryPayload, validEnquiry } = require(path.join(world, '../business-worlds/contract.ts'));
const messages = require(path.join(world, 'partner/messages.json'));
const esc = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const fixture = i => ({ id: `qa-partner-${i}`, public_reference: `QA-${i}`, item_key: `qa-partner-${i}`, slug: `qa-partner-${i}`, kind: 'saas_module', name: `Published fixture ${i}`, short_description: 'Isolated test record.', description: null, currency_label: 'MAD', price_mode: 'quote_only', price_amount: null, featured: false, availability_status: 'available', territory_id: null, category_key: 'test', category_title: 'Test', media_url: null, trust_labels: [], metadata: { experience_schema_key: 'partner-os-plan', business_storefront: { version: 1, conversion: 'subscription_request', fields: [] } } });
const experience = (locale, items = []) => ({ locale, key: 'establishments', territoryCode: 'FR', items, collections: [], featured: [], facets: {}, category: null, hero: {} });
const page = (locale, items = []) => render(React.createElement(EstablishmentsExperience, { experience: experience(locale, items), initialView: 'partner-os', partnerOnly: true }));
let checks = 0;
function check(name, run) { run(); checks++; console.log('PASS ' + name); }
try {
  check('twenty capabilities, sixty benefits and six chapters share stable identities', () => {
    assert.equal(MODULES.length, 20); assert.equal(CHAPTERS.length, 6);
    assert.equal(MODULES.flatMap(m => m.benefits).length, 60);
    assert.deepEqual(CHAPTERS.flatMap(c => c.modules).sort(), MODULES.map(m => m.key).sort());
  });
  check('all commercial descriptions, advantages, uses, preparation and FAQs are translated', () => {
    const strings = MODULES.flatMap(m => [m.label, m.tag, m.summary, ...m.benefits, ...m.uses, m.detail, m.prepare]);
    strings.push(...CHAPTERS.flatMap(c => [c.label, c.title, c.lead, c.cta]), ...FAQ.flat());
    for (const text of strings) {
      assert.ok(Object.hasOwn(messages, text), text); assert.equal(messages[text].length, 2);
      assert.ok(messages[text].every(value => typeof value === 'string' && value.trim()), text);
      assert.match(messages[text][1], /[\u0600-\u06ff]/, text);
    }
  });
  for (const locale of ['fr', 'en', 'ar']) {
    check(`${locale}: real page exposes every capability and benefit`, () => {
      const html = page(locale);
      assert.equal((html.match(/data-partner-module=/g) || []).length, 20);
      for (const module of MODULES) for (const text of [module.label, module.summary, ...module.benefits]) assert.ok(html.includes(esc(partnerText(locale, text))), text);
      assert.ok(html.includes(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`));
      assert.ok(html.includes(`lang="${locale}"`));
    });
    check(`${locale}: hero, native explorer, commercial journey and one enquiry retain their order`, () => {
      const html = page(locale, Array.from({ length: 23 }, (_, i) => fixture(i)));
      const positions = ['data-partner-hero', 'id="ew-native-explorer"', 'data-partner-journey="R1"', 'id="world-enquiry"'].map(value => html.indexOf(value));
      assert.ok(positions.every((value, i) => value >= 0 && (!i || value > positions[i - 1])));
      assert.equal((html.match(/data-offer-id=/g) || []).length, 10);
      assert.equal((html.match(/<form /g) || []).length, 1);
      assert.ok(html.includes(`/${locale}/subscription/qa-partner-0?territory=FR`));
      assert.ok(!html.includes('mailto:'));
    });
    check(`${locale}: genuine empty catalogue does not manufacture offers or hide capabilities`, () => {
      const html = page(locale); assert.equal((html.match(/data-offer-id=/g) || []).length, 0);
      assert.equal((html.match(/data-partner-module=/g) || []).length, 20);
      assert.ok(html.includes(esc(partnerText(locale, 'Votre projet mérite une réponse adaptée.'))));
    });
    check(`${locale}: a complete brief preserves every module and native reference within the endpoint limit`, () => {
      const t = text => partnerText(locale, text);
      const request = { ...EMPTY_PARTNER, modules: MODULES.map(m => m.key) };
      const selected = Array.from({ length: 8 }, (_, i) => offerSelection(fixture(i), locale));
      const message = enquiryMessage('', [partnerBrief(request, t), requestBrief('partner-os', selected, 'FR', t)].join('\n'));
      const values = { ...EMPTY_ENQUIRY, organization: 'QA', city: 'QA', email: 'qa@example.com', phone: '+33123456789', consent: true, message };
      assert.ok(validEnquiry('establishments', values)); assert.ok(message.length <= 2980);
      const payload = enquiryPayload('establishments', locale, values, `/angelcare-marketplace/${locale}/establishments/partner-os?territory=FR#partner-os`);
      assert.equal(payload.sourceLocale, locale);
      for (const module of MODULES) assert.ok(payload.needs.includes(t(module.label)));
      for (let i = 0; i < 8; i++) assert.ok(payload.needs.includes(`[qa-partner-${i}]`));
    });
  }
  check('all languages render identical structures, chapters, controls and source images', () => {
    const structures = ['fr', 'en', 'ar'].map(locale => {
      const html = page(locale);
      return { tags: html.match(/<\/?[a-z][a-z0-9-]*\b/g), images: [...html.matchAll(/\bsrc="([^"]+)"/g)].map(m => m[1]), chapters: [...html.matchAll(/data-partner-section="([^"]+)"/g)].map(m => m[1]) };
    });
    assert.deepEqual(structures[1], structures[0]); assert.deepEqual(structures[2], structures[0]);
  });
  check('every language pair keeps canonical territory, query and deep links', () => {
    for (const from of ['fr', 'en', 'ar']) for (const to of ['fr', 'en', 'ar']) {
      const expected = `/angelcare-marketplace/${to}/establishments/partner-os?territory=FR&utm_source=brochure#partner-os/pos-module-qualite`;
      for (const source of [`/angelcare-marketplace/${from}/establishments/partner-os`, `/angelcare-marketplace/${from}/establishments/`]) assert.equal(partnerLocaleHref(to, source, '?territory=FR&utm_source=brochure', '#partner-os/pos-module-qualite'), expected);
    }
    assert.equal(partnerLocaleHref('en', '/angelcare-marketplace/fr/establishments', '', '#produits'), '/angelcare-marketplace/en');
    assert.equal(partnerLocaleHref('ar', 'https://external.invalid/establishments/partner-os'), '/angelcare-marketplace/ar');
  });
  check('native shell language links expose accessible names and selected language', () => {
    for (const locale of ['fr', 'en', 'ar']) {
      const html = render(React.createElement(PartnerLocaleLinks, { locale, dedicated: true }));
      assert.equal((html.match(/<a /g) || []).length, 3); assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
      for (const code of ['fr', 'en', 'ar']) assert.ok(html.includes(`href="/angelcare-marketplace/${code}/establishments/partner-os"`));
      for (const language of ['Français', 'English', 'العربية']) assert.ok(html.includes(`aria-label="${language}"`));
    }
  });
  check('language-independent studio state rejects invalid values and contact data', () => {
    const selected = { pain: 2, admissions: 3, planning: 2, team: 'qualite', finance: 'paiements', all: true };
    for (const locale of ['fr', 'en', 'ar']) assert.deepEqual(restorePresentation({ ...selected, locale, email: 'qa@example.com' }), selected);
    assert.deepEqual(restorePresentation({ pain: -1, admissions: 4, planning: 0.5, team: 'unknown', finance: 'rh', all: 'true' }), EMPTY_PRESENTATION);
    assert.deepEqual(restorePresentation(null), EMPTY_PRESENTATION);
  });
  check('module choices remain independent, reversible and free of contact details', () => {
    let request = { ...EMPTY_PARTNER, modules: [] };
    for (const module of MODULES) request = toggleModule(request, module.key);
    assert.equal(request.modules.length, 20); request = toggleModule(request, 'qualite'); assert.equal(request.modules.length, 19);
    assert.deepEqual(restorePartner({ ...request, email: 'qa@example.com', modules: [...request.modules, 'unknown'] }), request);
  });
  check('Arabic text fields use automatic direction; contact identifiers retain Latin direction', () => {
    const html = page('ar');
    for (const name of ['email', 'phone', 'capacity']) assert.match(html, new RegExp(`<input(?=[^>]*name="${name}")(?=[^>]*dir="ltr")[^>]*>`));
    for (const name of ['organization', 'city', 'fullName']) assert.match(html, new RegExp(`<input(?=[^>]*name="${name}")(?=[^>]*dir="auto")[^>]*>`));
    assert.match(html, /<textarea[^>]+dir="auto"/);
  });
  check('authoritative catalogue names survive translated action labels and image alternatives', () => {
    for (const locale of ['en', 'ar']) {
      const offer = { ...fixture(0), name: 'Direction & vue d’ensemble', media_url: '/native.png' };
      const html = page(locale, [offer]);
      assert.ok(html.includes(`alt="${esc(offer.name)}"`));
      assert.ok(html.includes(`aria-label="${esc(partnerText(locale, 'Aperçu de {0}').replace('{0}', offer.name))}"`));
    }
  });
  check('Arabic count labels include singular, dual and plural forms', () => {
    assert.match(countText('ar', 1), /عرض$/); assert.match(countText('ar', 2), /عرضان$/); assert.match(countText('ar', 4), /عروض$/);
    assert.equal(countText('en', 1), '1 offer'); assert.equal(countText('en', 2), '2 offers');
  });
  console.log(`PARTNER_OS_LANGUAGE_PARITY=PASS (${checks})`);
} finally {
  for (const [key, handler] of Object.entries(original)) require.extensions[key] = handler;
}
