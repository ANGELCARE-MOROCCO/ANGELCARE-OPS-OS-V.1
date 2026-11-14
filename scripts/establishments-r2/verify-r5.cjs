/* Run from repository root, with the application's dependencies available to Node. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "../..");
const world = path.join(
  root,
  "apps/marketplace-web/angelcare-marketplace/establishments-world",
);
const oldTs = require.extensions[".ts"],
  oldTsx = require.extensions[".tsx"],
  oldCss = require.extensions[".css"];
const compile = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    }).outputText,
    file,
  );
require.extensions[".ts"] = compile;
require.extensions[".tsx"] = compile;
require.extensions[".css"] = (module) => {
  module.exports = {
    __esModule: true,
    default: new Proxy({}, { get: (_, name) => String(name) }),
  };
};
const { catalogueWindow } = require(path.join(world, "catalogue-window.ts"));
const { CAMPAIGNS, COMMERCIAL, QUESTIONS, SCENARIOS } = require(
  path.join(world, "commercial-content.ts"),
);
const { MODULES, FORMULAS, PRODUCT_CHAPTERS } = require(
  path.join(world, "content.ts"),
);
const { CommercialJourney } = require(
  path.join(world, "CommercialJourney.tsx"),
);
const { EstablishmentsExperience } = require(
  path.join(world, "Experience.tsx"),
);
const { ProjectEnquiry } = require(path.join(world, "ProjectEnquiry.tsx"));
const { NativeExplorer } = require(path.join(world, "OfferExplorer.tsx"));
const {
  EMPTY_ENQUIRY,
  validEnquiry,
  enquiryPayload,
  responseReference,
} = require(
  path.join(
    root,
    "apps/marketplace-web/angelcare-marketplace/business-worlds/contract.ts",
  ),
);
let count = 0;
function check(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
const callbacks = {
  email: "",
  onEmail() {},
  onContact() {},
  selected: [],
  onSelect() {},
};
const item = (i) => ({
  id: `fixture-${i}`,
  public_reference: `TEST-${i}`,
  item_key: `fixture-${i}`,
  slug: `fixture-${i}`,
  kind: "product",
  name: `Offre de test ${i}`,
  short_description: "Donnée synthétique de vérification",
  description: null,
  currency_label: "MAD",
  price_mode: "fixed",
  price_amount: 100 + i,
  featured: false,
  availability_status: "available",
  territory_id: null,
  category_key: "test",
  category_title: "Test",
  media_url: null,
  trust_labels: [],
  metadata: {},
});
check(
  "0/9/10/11/21 offers retain honest totals and initial 10-card window",
  () => {
    for (const n of [0, 9, 10, 11, 21]) {
      const w = catalogueWindow(n, 10, 1);
      assert.equal(w.shown, Math.min(n, 10));
      assert.equal(w.remaining, Math.max(0, n - 10));
      assert.equal(w.pages, Math.max(1, Math.ceil(n / 10)));
    }
  },
);
check(
  "load-more appends a contiguous nonduplicate slice and stops at actual inventory",
  () => {
    const items = Array.from({ length: 31 }, (_, i) => i);
    let old = [];
    for (let extra = 0; extra < 6; extra++) {
      const w = catalogueWindow(items.length, 10, 1, extra),
        next = items.slice(w.start, w.end);
      assert.deepEqual(next.slice(0, old.length), old);
      assert.equal(new Set(next).size, next.length);
      assert.ok(next.length <= items.length);
      old = next;
    }
  },
);
check(
  "numbered pages and additive loading share a well-defined boundary",
  () => {
    assert.deepEqual(catalogueWindow(31, 10, 2, 1), {
      page: 2,
      pages: 4,
      start: 10,
      end: 30,
      shown: 20,
      remaining: 1,
      nextCount: 1,
    });
    assert.equal(catalogueWindow(31, 10, 3).start, 20);
    assert.equal(catalogueWindow(31, 10, 3).shown, 10);
  },
);
check(
  "filter shrink and corrupted pagination never produce an empty out-of-range page",
  () => {
    assert.equal(catalogueWindow(3, 10, 999).shown, 3);
    assert.equal(catalogueWindow(3, 10, -9).page, 1);
    assert.equal(catalogueWindow(11, 0, NaN, Infinity).shown, 10);
    for (const size of [10, 20, 40]) {
      const w = catalogueWindow(93, size, 2, 1);
      assert.equal(w.shown, Math.min(93 - size, size * 2));
    }
  },
);
check(
  "all twenty native brochure capabilities belong to exactly one promotional campaign",
  () => {
    const ids = CAMPAIGNS["partner-os"].flatMap((c) => c.modules || []);
    assert.equal(ids.length, 20);
    assert.equal(new Set(ids).size, 20);
    assert.deepEqual([...ids].sort(), MODULES.map((m) => m.id).sort());
  },
);
check(
  "all sixteen universes are exposed across four commercial stories",
  () => {
    const chapters = CAMPAIGNS.produits.flatMap((c) =>
      c.chapter === undefined ? [] : [c.chapter],
    );
    assert.deepEqual(chapters, [0, 1, 2, 3]);
    assert.equal(
      chapters.reduce((n, i) => n + PRODUCT_CHAPTERS[i].universes.length, 0),
      16,
    );
  },
);
for (const view of ["conseil", "partner-os", "produits"]) {
  check(
    `${view}: actual commercial renderer includes twelve substantive blocks and six contact prompts`,
    () => {
      const html = renderToStaticMarkup(
        React.createElement(CommercialJourney, { view, ...callbacks }),
      );
      assert.equal((html.match(/data-commercial-block=/g) || []).length, 12);
      assert.equal((html.match(/aria-label="Contact :/g) || []).length, 6);
      assert.ok(
        !html.includes("href="),
        "commercial stories must not introduce deep navigation",
      );
      assert.equal(new Set(CAMPAIGNS[view].map((c) => c.id)).size, 6);
      assert.equal(QUESTIONS[view].length, 6);
      assert.equal(SCENARIOS[view].length, 3);
      if (view === "conseil")
        for (const f of FORMULAS)
          assert.ok(html.includes(`data-formula="${f.id}"`));
      if (view === "partner-os")
        for (const m of MODULES)
          assert.ok(html.includes(`data-module="${m.id}"`));
      if (view === "produits")
        assert.equal((html.match(/data-universe=/g) || []).length, 16);
    },
  );
  check(
    `${view}: commercial copy has substantive unique descriptions rather than repeated slogans`,
    () => {
      const text = JSON.stringify({
        copy: COMMERCIAL[view],
        campaigns: CAMPAIGNS[view],
        questions: QUESTIONS[view],
        scenarios: SCENARIOS[view],
      });
      assert.ok(text.split(/\s+/).length >= 1400);
      assert.equal(new Set(CAMPAIGNS[view].map((c) => c.solution)).size, 6);
    },
  );
}
check(
  "real page renderer places native 10-card explorer directly after hero",
  () => {
    const experience = {
      locale: "fr",
      key: "establishments",
      territoryCode: "MA",
      items: Array.from({ length: 12 }, (_, i) => ({
        ...item(i),
        kind: "service",
      })),
      collections: [],
      featured: [],
      facets: {},
      category: null,
      hero: {},
    };
    const html = renderToStaticMarkup(
      React.createElement(EstablishmentsExperience, { experience }),
    );
    const hero = html.indexOf("data-establishments-hero"),
      catalogue = html.indexOf('id="ew-native-explorer"'),
      editorial = html.indexOf('data-commercial-block="introduction"');
    assert.ok(hero > 0 && catalogue > hero && editorial > catalogue);
    assert.ok(!html.slice(hero, catalogue).includes("data-commercial-block"));
    assert.equal(
      (html.match(/data-establishments-journey="R5"/g) || []).length,
      1,
    );
    assert.equal((html.match(/data-offer-id=/g) || []).length, 10);
  },
);
check(
  "contextual contact retains native required fields and reference confirmation contract",
  () => {
    const values = {
      ...EMPTY_ENQUIRY,
      organization: "Test",
      city: "Rabat",
      email: "test@example.com",
      phone: "0600000000",
      consent: true,
      message: "Sujet de la demande : Pratiques équipe",
    };
    assert.equal(validEnquiry("establishments", values), true);
    for (const key of ["organization", "city", "email", "phone"])
      assert.equal(
        validEnquiry("establishments", { ...values, [key]: "" }),
        false,
        key,
      );
    assert.equal(
      validEnquiry("establishments", { ...values, consent: false }),
      false,
    );
    const payload = enquiryPayload(
      "establishments",
      "fr",
      values,
      "/angelcare-marketplace/fr/establishments#conseil",
    );
    assert.ok(payload.needs.includes(values.message));
    assert.equal(
      responseReference({ data: { publicReference: "TEST-2026" } }),
      "TEST-2026",
    );
    assert.equal(responseReference({ success: true }), null);
  },
);
check(
  "context-supplied enquiry makes only complementary message optional",
  () => {
    const common = {
      view: "conseil",
      brief: "Sujet de la demande : Formation",
      sourceRoute: "/test",
      values: { ...EMPTY_ENQUIRY },
      onValuesChange() {},
    };
    const contextual = renderToStaticMarkup(
      React.createElement(ProjectEnquiry, { ...common, hasContext: true }),
    );
    const plain = renderToStaticMarkup(
      React.createElement(ProjectEnquiry, { ...common, hasContext: false }),
    );
    assert.ok(contextual.includes("Précisions complémentaires (facultatif)"));
    assert.ok(!contextual.match(/<textarea[^>]*required/));
    assert.ok(plain.match(/<textarea[^>]*required/));
    const consent = contextual
      .match(/<input[^>]*>/g)
      .find((input) => input.includes('name="consent"'));
    assert.ok(consent.includes("required"));
  },
);
check(
  "rendered campaign photos use responsive native PNG sources, not legacy enlarged crops",
  () => {
    const html = renderToStaticMarkup(
      React.createElement(CommercialJourney, {
        view: "produits",
        ...callbacks,
      }),
    );
    assert.ok(html.includes("1536w"));
    assert.ok(html.includes('loading="lazy"'));
    assert.ok(!html.includes("/establishments-r2/"));
    assert.ok(!html.includes(".webp"));
  },
);
check("native renderer preserves canonical conversion, published facets and comparison fields", () => {
  const fields = [{key:'personalization_options',label:'Personnalisation',value:'Format · Couleur',values:['Format','Couleur']}];
  const a = {...item(0), metadata:{business_storefront:{version:1,conversion:'b2b_quote',fields}}};
  const b = {...item(1),metadata:{business_storefront:{version:1,conversion:'subscription_request',fields}}};
  const experience={locale:'fr',key:'establishments',territoryCode:'MA',items:[a,b],collections:[],featured:[],facets:{}};
  const selections={saved:[a.id],compared:[a.id,b.id],pending:[],error:null,select(){},remember(){},dismiss(){}};
  const html=renderToStaticMarkup(React.createElement(NativeExplorer,{experience,view:'produits',selected:[],add(){},selections,onDetail(){}}));
  assert.ok(html.includes('/quotation/fixture-0?territory=MA'));
  assert.ok(html.includes('/subscription/fixture-1?territory=MA'));
  assert.ok(html.includes('Personnalisation'));assert.ok(html.includes('Format'));assert.ok(html.includes('Comparer les offres publiées'));
  assert.equal((html.match(/data-offer-id=/g)||[]).length,2);
});
require.extensions[".ts"] = oldTs;
require.extensions[".tsx"] = oldTsx;
require.extensions[".css"] = oldCss;
console.log(`ESTABLISHMENTS_R5_BEHAVIOR=PASS (${count})`);
