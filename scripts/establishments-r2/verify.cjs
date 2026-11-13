/* Run from the repository root: node scripts/establishments-r2/verify.cjs */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const previous = require.extensions[".ts"];
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const root = path.resolve(__dirname, "../..");
const app = path.join(root, "apps/marketplace-web");
const m = require(
  path.join(app, "angelcare-marketplace/establishments-world/model.ts"),
);
const c = require(
  path.join(app, "angelcare-marketplace/establishments-world/content.ts"),
);
const registry = require(
  path.join(app, "angelcare-marketplace/marketplace-imagery/registry.ts"),
);
let count = 0;
const check = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
const item = (extra = {}) => ({
  id: "native-id",
  kind: "product",
  metadata: {},
  item_key: "equipment",
  name: "Équipement",
  public_reference: "AC-1",
  short_description: "Classe",
  availability_status: "available",
  price_mode: "fixed",
  price_amount: 100,
  currency_label: "MAD",
  featured: false,
  ...extra,
});
const opts = {
  view: "produits",
  query: "",
  category: "all",
  availability: "all",
  sort: "featured",
};
check("three views; anchor suffix keeps the correct view", () => {
  assert.equal(m.viewFromHash("#partner-os/ew-stories"), "partner-os");
  assert.equal(m.viewFromHash("#produits/world-enquiry"), "produits");
  assert.equal(m.viewFromHash("#unknown"), "conseil");
});
check("native channel boundaries", () => {
  assert.equal(m.channel(item()), "produits");
  assert.equal(m.channel(item({ kind: "kit" })), "produits");
  assert.equal(m.channel(item({ kind: "saas_module" })), "partner-os");
  assert.equal(m.channel(item({ kind: "audit" })), "conseil");
});
check("brochure titles never fabricate native IDs", () => {
  assert.equal(
    m.linkedOffer(c.FORMULAS[0], [
      item({ kind: "service", name: c.FORMULAS[0].name }),
    ]),
    undefined,
  );
  assert.equal(
    m.linkedOffer(c.FORMULAS[0], [
      item({ kind: "service", item_key: c.FORMULAS[0].id }),
    ]).id,
    "native-id",
  );
});
check("published metadata binding must be exact", () => {
  assert.equal(
    m.linkedOffer(c.FORMULAS[0], [
      item({
        kind: "service",
        metadata: {
          experience_configuration: { programme_key: c.FORMULAS[0].id },
        },
      }),
    ]).id,
    "native-id",
  );
  assert.equal(
    m.linkedOffer(c.FORMULAS[0], [item({ item_key: c.FORMULAS[0].id })]),
    undefined,
  );
});
check("accent-insensitive search and category/status filtering", () => {
  const a = item({ category_key: "classroom" });
  assert.equal(m.filterOffers([a], { ...opts, query: "equipement" }).length, 1);
  assert.equal(m.filterOffers([a], { ...opts, category: "other" }).length, 0);
  assert.equal(
    m.filterOffers([a], { ...opts, availability: "sold_out" }).length,
    0,
  );
});
check(
  "price sort keeps quote-only unknown prices last; source array unchanged",
  () => {
    const list = [
      item({ id: "quote", price_amount: null }),
      item({ id: "priced", price_amount: 0 }),
    ];
    assert.deepEqual(
      m.filterOffers(list, { ...opts, sort: "price" }).map((x) => x.id),
      ["priced", "quote"],
    );
    assert.equal(list[0].id, "quote");
  },
);
check("native unavailable states cannot enter a new project", () => {
  for (const availability_status of [
    "sold_out",
    "closed",
    "paused",
    "blocked",
    "unavailable",
    "out_of_stock",
    "territory_restricted",
  ])
    assert.ok(m.blocked(item({ availability_status })));
  assert.ok(!m.blocked(item()));
});
check("selection is bounded and reversible", () => {
  let list = [];
  for (let i = 0; i < 9; i++)
    list = m.toggleSelection(list, {
      key: String(i),
      title: "T",
      kind: "formula",
      detail: "D",
    });
  assert.equal(list.length, 8);
  assert.equal(m.toggleSelection(list, list[0]).length, 7);
});
check(
  "brief preserves native identity, territory, reference distinction and real newlines",
  () => {
    const brief = m.requestBrief(
      "produits",
      [
        {
          key: "offer:uuid",
          kind: "offer",
          id: "uuid",
          title: "Native",
          detail: "AC-1",
        },
        {
          key: "formula:f",
          kind: "formula",
          title: "Reference",
          detail: "Brochure",
        },
      ],
      "MA",
    );
    assert.ok(brief.includes("[uuid]"));
    assert.ok(brief.includes("Formule de référence brochure"));
    assert.ok(brief.includes("MA"));
    assert.ok(brief.includes("\n"));
    assert.ok(!brief.includes("\\n"));
  },
);
check("price authority respects quote-only and legitimate zero price", () => {
  assert.equal(m.price(item({ price_mode: "quote_only" })), "Sur devis");
  assert.match(m.price(item({ price_amount: 0 })), /^0 MAD/);
});
check("nine formulas, twenty capabilities and sixteen universes", () => {
  assert.equal(c.FORMULAS.length, 9);
  assert.equal(c.MODULES.length, 20);
  assert.equal(
    c.PRODUCT_CHAPTERS.reduce((n, x) => n + x.universes.length, 0),
    16,
  );
  assert.equal(new Set(c.FORMULAS.map((x) => x.id)).size, 9);
});
check("all 40 source images resolve only under establishments", () => {
  const provenance = JSON.parse(
    fs.readFileSync(
      path.join(
        app,
        "public/angelcare-marketplace/establishments-r2/provenance.json",
      ),
    ),
  );
  assert.equal(provenance.assets.length, 40);
  for (const a of provenance.assets) {
    const name = a.asset.replace(".png", "");
    const slot = registry.resolveSlot(
      "establishments",
      "establishments.journey." + name,
    );
    assert.equal(
      slot.source,
      "/angelcare-marketplace/establishments-r2/" + a.asset,
    );
    assert.ok(fs.existsSync(path.join(app, "public", slot.source)));
    assert.equal(
      registry.resolveSlot("families", "families.journey." + name),
      undefined,
    );
  }
});

check(
  "restoration rebuilds current native offers and drops blocked or unknown identities",
  () => {
    const live = item({ id: "live", name: "Current name" });
    const raw = JSON.stringify([
      "offer:missing",
      "offer:blocked",
      "offer:live",
      "offer:live",
      "formula:" + c.FORMULAS[0].id,
      "module:" + c.MODULES[0].id,
      "intent:partner-free-year",
      "formula:forged",
    ]);
    const restored = m.restoreProject(raw, [
      live,
      item({ id: "blocked", availability_status: "paused" }),
    ]);
    assert.equal(restored.length, 4);
    assert.equal(restored[0].title, "Current name");
    assert.equal(restored[0].id, "live");
    assert.ok(!restored.some((x) => x.key === "offer:blocked"));
    assert.deepEqual(m.restoreProject("{bad", []), []);
  },
);
check(
  "free-year request is idempotent and cannot silently overflow project capacity",
  () => {
    let state = { items: [], notice: "" };
    state = m.projectReducer(state, { type: "free" });
    state = m.projectReducer(state, { type: "free" });
    assert.equal(state.items.length, 1);
    for (let i = 0; i < 8; i++)
      state = m.projectReducer(state, {
        type: "toggle",
        item: {
          key: "formula:qa" + i,
          title: "QA " + i,
          detail: "Reference",
          kind: "formula",
        },
      });
    assert.equal(state.items.length, 8);
    assert.match(state.notice, /huit/);
    const full = {
      items: Array.from({ length: 8 }, (_, i) => ({
        key: "x" + i,
        title: "X",
        detail: "D",
        kind: "formula",
      })),
      notice: "",
    };
    const rejected = m.projectReducer(full, { type: "free" });
    assert.equal(rejected.items, full.items);
    assert.match(rejected.notice, /huit/);
  },
);
check(
  "public characteristic, pricing and favourite filters use exact published values",
  () => {
    const a = item({
      id: "custom",
      price_mode: "quote_only",
      metadata: {
        business_storefront: {
          version: 1,
          fields: [
            {
              key: "personalization_options",
              label: "Personnalisation",
              value: "Logo",
              values: ["Logo"],
            },
          ],
        },
      },
    });
    const b = item({ id: "standard" });
    assert.deepEqual(
      m
        .filterOffers([a, b], { ...opts, priceMode: "quote_only" })
        .map((x) => x.id),
      ["custom"],
    );
    assert.deepEqual(
      m
        .filterOffers([a, b], {
          ...opts,
          savedOnly: true,
          savedIds: ["standard"],
        })
        .map((x) => x.id),
      ["standard"],
    );
    assert.deepEqual(
      m
        .filterOffers([a, b], {
          ...opts,
          factKey: "personalization_options",
          factValue: "Logo",
        })
        .map((x) => x.id),
      ["custom"],
    );
    assert.equal(
      m.filterOffers([a, b], {
        ...opts,
        factKey: "personalization_options",
        factValue: "logo",
      }).length,
      0,
    );
    assert.equal(m.publicFacets([a])[0].label, "Personnalisation");
  },
);
check(
  "corrupted session filters are bounded and cannot introduce arbitrary sort modes",
  () => {
    const filters = m.decodeFilters({
      query: "x".repeat(500),
      sort: "<script>",
      page: -20,
      priceMode: "invented",
      savedOnly: "yes",
    });
    assert.equal(filters.query.length, 160);
    assert.equal(filters.sort, "featured");
    assert.equal(filters.page, 1);
    assert.equal(filters.priceMode, "all");
    assert.equal(filters.savedOnly, false);
  },
);
check(
  "enquiry assembly never truncates an ID or the customer message after 2000 characters",
  () => {
    const message = "Customer context ".repeat(20);
    const brief = "Preparation ".repeat(210) + "Offer [last-native-id]";
    const joined = m.enquiryMessage(message, brief);
    assert.ok(joined.endsWith("[last-native-id]"));
    assert.ok(joined.startsWith(message.trim()));
    assert.equal(joined, message.trim() + "\n\n" + brief.trim());
    assert.ok(joined.length > 2000);
  },
);
check(
  "sorting quote-only published amounts does not imply a purchasable price",
  () => {
    const values = [
      item({ id: "quote", price_mode: "quote_only", price_amount: 1 }),
      item({ id: "fixed", price_amount: 100 }),
    ];
    assert.deepEqual(
      m.filterOffers(values, { ...opts, sort: "price" }).map((x) => x.id),
      ["fixed", "quote"],
    );
  },
);
check(
  "explicit broadening includes service-classified B2B offers without relabelling them as products",
  () => {
    const service = item({ kind: "service", id: "service-b2b" });
    assert.equal(m.filterOffers([service], opts).length, 0);
    assert.equal(m.filterOffers([service], { ...opts, view: "all" }).length, 1);
    assert.equal(m.channel(service), "conseil");
  },
);
require.extensions[".ts"] = previous;
console.log(`ESTABLISHMENTS_R3_CONTRACTS=PASS (${count})`);
