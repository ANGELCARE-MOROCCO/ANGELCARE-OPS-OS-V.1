import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const appRoot = path.resolve(import.meta.dirname, "../..");
const root = path.join(appRoot, "angelcare-marketplace");
const require = createRequire(path.join(appRoot, "package.json"));
const ts = require("typescript");
const modules = new Map();
function load(file) {
  const name = path.resolve(file);
  if (!name.startsWith(root + path.sep))
    throw Error("Test module outside marketplace");
  if (modules.has(name)) return modules.get(name).exports;
  if (name.endsWith(".json")) return JSON.parse(fs.readFileSync(name, "utf8"));
  const module = { exports: {} };
  modules.set(name, module);
  const compiled = ts.transpileModule(fs.readFileSync(name, "utf8"), {
    fileName: name,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier === "server-only") return {};
    if (specifier === "react") return { cache: (fn) => fn };
    if (specifier === "@/lib/supabase/server")
      return { createServiceClient: async () => globalThis.businessTestDB };
    if (!specifier.startsWith("."))
      throw Error("Unexpected test dependency: " + specifier);
    const target = path.resolve(path.dirname(name), specifier);
    const resolved = [
      target,
      target + ".ts",
      target + ".tsx",
      target + ".json",
    ].find(
      (candidate) =>
        fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    );
    if (!resolved) throw Error("Missing source: " + specifier);
    return load(resolved);
  };
  new Function("require", "module", "exports", compiled)(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}
const model = {
  ...load(path.join(root, "business-worlds/repository.ts")),
  ...load(path.join(root, "business-worlds/merchandising.ts")),
  ...load(path.join(root, "business-worlds/contract.ts")),
};
let checks = 0;
const check = (name, fn) => {
  fn();
  checks++;
  console.log("[PASS]", name);
};
class Query {
  constructor(db, table) {
    this.db = db;
    this.table = table;
    this.filters = [];
    this.orders = [];
    this.offset = 0;
    this.end = Infinity;
    this.single = false;
  }
  select() {
    return this;
  }
  eq(k, v) {
    this.filters.push((r) => r[k] === v);
    return this;
  }
  in(k, v) {
    this.filters.push((r) => v.includes(r[k]));
    return this;
  }
  order(k, o = {}) {
    this.orders.push([k, o]);
    return this;
  }
  range(start, end) {
    this.offset = start;
    this.end = end;
    this.db.pages.push({ table: this.table, start, end });
    return this;
  }
  or(expr) {
    const match = expr.match(/territory_id\.eq\.([^,]+)/);
    if (match)
      this.filters.push(
        (r) => r.territory_id == null || r.territory_id === match[1],
      );
    return this;
  }
  maybeSingle() {
    this.single = true;
    return this;
  }
  then(resolve, reject) {
    try {
      if (this.db.failTable === this.table)
        return Promise.resolve({
          data: null,
          error: { message: "simulated outage" },
        }).then(resolve, reject);
      let rows = this.db.tables[this.table] || [];
      rows = rows
        .filter((row) => this.filters.every((fn) => fn(row)))
        .sort((a, b) => {
          for (const [key, options] of this.orders) {
            const aValue = a[key],
              bValue = b[key];
            if (aValue === bValue) continue;
            const difference = aValue < bValue ? -1 : 1;
            return options.ascending === false ? -difference : difference;
          }
          return 0;
        })
        .slice(this.offset, this.end + 1);
      return Promise.resolve({
        data: this.single ? rows[0] || null : structuredClone(rows),
        error: null,
      }).then(resolve, reject);
    } catch (error) {
      return Promise.reject(error).then(resolve, reject);
    }
  }
}
const category = (
  id,
  key,
  status = "published",
  visible = true,
  locale = "fr",
) => ({ id, category_key: key, status, visible, locale, territory_id: null });
const schemas = [
  "school-managed-programme",
  "hospitality-kids-programme",
  "health-adjacent-programme",
  "corporate-childcare-benefit",
  "partner-os-plan",
  "quality-check-assessment",
  "academy-course",
];
const keys = [
  "establishments",
  "hospitality",
  "health-partners",
  "corporates",
  "partner-os",
  "quality-check",
  "professionals",
];
function offer(id, schema, extra = {}) {
  return {
    id,
    item_key: id,
    slug: id,
    kind:
      schema === "academy-course"
        ? "training"
        : schema === "partner-os-plan"
          ? "saas_module"
          : schema === "quality-check-assessment"
            ? "audit"
            : "service",
    status: "published",
    name_fr: "Offre " + id,
    name_en: "Offer " + id,
    category_key: "families",
    category_title_fr: "Familles",
    featured: false,
    merchandising_priority: 10,
    availability_status: "available",
    territory_id: null,
    price_amount: 100,
    price_mode: "quote_only",
    currency_label: "Dh",
    experience_schema_key: schema,
    experience_configuration: {
      organization_type: "school",
      intended_audience: "professional",
      children_capacity: 40,
      assessment_scope: ["practice", "team"],
      included_modules: ["workspace", "roles"],
      internal_secret: "DO_NOT_SERIALIZE",
    },
    ...extra,
  };
}
function database(offers, categories, links) {
  const db = {
    tables: {
      angelcare_marketplace_catalog_discovery_v: offers,
      angelcare_marketplace_catalog_items: offers.map((row) => ({
        id: row.id,
        status: row.status,
        attributes: { internal_token: "NEVER_EXPOSE", ...row.attributes },
      })),
      angelcare_marketplace_catalog_categories: categories,
      angelcare_marketplace_catalog_item_categories: links,
      angelcare_marketplace_territories: [
        { id: "ma", territory_code: "MA-MASTER" },
        { id: "fr", territory_code: "FR" },
      ],
    },
    pages: [],
    from(table) {
      return new Query(this, table);
    },
  };
  globalThis.businessTestDB = db;
  return db;
}
const publicCategory = category("family", "families");
const offers = schemas.map((schema, i) => offer("native-" + i, schema));
const db = database(
  offers,
  [publicCategory],
  offers.map((row, i) => ({
    id: "link-" + i,
    catalog_item_id: row.id,
    category_id: "family",
  })),
);
for (let index = 0; index < keys.length; index++) {
  const result = await model.businessExposure(keys[index], "fr");
  check(keys[index] + " native doctrine/audience bridge", () =>
    assert(result.items.some((item) => item.id === "native-" + index)),
  );
  check(keys[index] + " private metadata excluded", () =>
    assert(
      !JSON.stringify(result.items).includes("DO_NOT_SERIALIZE") &&
        !JSON.stringify(result.items).includes("NEVER_EXPOSE"),
    ),
  );
}
check("Alias labels alone never grant storefront access", () =>
  assert.equal(
    model.candidateReason(
      "establishments",
      "non-medical-support-service",
      ["institutions"],
      [],
    ),
    null,
  ),
);
check("Consumer offers do not become health partnerships", () =>
  assert.equal(
    model.candidateReason(
      "health-partners",
      "non-medical-support-service",
      ["health-adjacent"],
      [],
    ),
    null,
  ),
);
check("Parent audience does not become professional course", () =>
  assert.equal(
    model.candidateReason(
      "professionals",
      "academy-course",
      ["academy"],
      ["parents"],
    ),
    null,
  ),
);
check("Professional audience enters through exact structured value", () =>
  assert.equal(
    model.candidateReason(
      "professionals",
      "academy-course",
      ["academy"],
      ["professional"],
    ),
    "professional_audience",
  ),
);
check("Babysitter audience is a professional learning audience", () =>
  assert.equal(
    model.candidateReason(
      "professionals",
      "academy-course",
      ["academy"],
      ["babysitters"],
    ),
    "professional_audience",
  ),
);
let result = await model.businessExposure("quality-check", "fr");
check("Assessment conversion comes from doctrine", () =>
  assert.match(
    model.nativeAction(result.items[0], "fr").href,
    /\/quotation\/native-5$/,
  ),
);
check("Native conversion preserves selected territory", () =>
  assert.match(
    model.nativeAction(result.items[0], "fr", "MA-MASTER").href,
    /\?territory=MA-MASTER$/,
  ),
);
check("Canonical details preserve selected territory", () =>
  assert.match(
    model.businessItemHref(result.items[0], "ar", "MA-MASTER"),
    /\/ar\/marketplace\/item\/native-5\?territory=MA-MASTER$/,
  ),
);
check("Quality public comparison facts projected", () =>
  assert(
    result.items[0].metadata.business_storefront.fields.some(
      (field) => field.key === "assessment_scope",
    ),
  ),
);
check("Unknown schema never invents booking", () =>
  assert.equal(
    model.nativeAction(offer("unknown", "not-registered"), "fr"),
    null,
  ),
);
database(
  [
    offer("hidden", "school-managed-programme"),
    offer("draft", "school-managed-programme", { status: "draft" }),
    offer("hidden-category", "school-managed-programme"),
  ],
  [
    category("draft-category", "establishments", "draft"),
    category("hidden-category", "families", "published", false),
  ],
  [
    { id: "a", catalog_item_id: "hidden", category_id: "draft-category" },
    { id: "b", catalog_item_id: "draft", category_id: "draft-category" },
    {
      id: "c",
      catalog_item_id: "hidden-category",
      category_id: "hidden-category",
    },
  ],
);
result = await model.businessExposure("establishments", "fr");
check("Draft offers and draft/hidden-only categories stay excluded", () =>
  assert.equal(result.items.length, 0),
);
database(
  [offer("localized-hidden", "school-managed-programme")],
  [
    category("fr", "establishments"),
    category("en", "establishments", "published", false, "en"),
  ],
  [{ id: "l", catalog_item_id: "localized-hidden", category_id: "fr" }],
);
result = await model.businessExposure("establishments", "en");
check(
  "Explicit hidden translation does not fall back into public exposure",
  () => assert.equal(result.items.length, 0),
);
const many = Array.from({ length: 487 }, (_, i) =>
  offer("bulk-" + String(i).padStart(3, "0"), "school-managed-programme"),
);
const large = database(
  many,
  [publicCategory],
  many.flatMap((row, i) => [
    { id: "l-" + i, catalog_item_id: row.id, category_id: "family" },
  ]),
);
result = await model.businessExposure("establishments", "fr");
check("487 eligible offers survive 120/240 boundaries", () =>
  assert.equal(result.items.length, 487),
);
check("Pagination reads beyond the second page", () =>
  assert(
    large.pages.some(
      (page) =>
        page.table === "angelcare_marketplace_catalog_discovery_v" &&
        page.start === 480,
    ),
  ),
);
check("Tied merchandising order ends in stable item ID", () =>
  assert.deepEqual(
    result.items.map((item) => item.id),
    many.map((item) => item.id),
  ),
);
database(
  [offer("multi", "school-managed-programme")],
  [publicCategory, category("schools", "establishments")],
  [
    { id: "1", catalog_item_id: "multi", category_id: "family" },
    { id: "2", catalog_item_id: "multi", category_id: "schools" },
    { id: "3", catalog_item_id: "multi", category_id: "schools" },
  ],
);
result = await model.businessExposure("establishments", "fr");
check("Multiple associations preserved without duplicated cards", () => {
  assert.equal(result.items.length, 1);
  assert.deepEqual(
    result.items[0].metadata.business_storefront.categories.sort(),
    ["establishments", "families"],
  );
  assert.equal(result.items[0].category_key, "families");
});
database(
  [
    offer("global", "school-managed-programme"),
    offer("morocco", "school-managed-programme", { territory_id: "ma" }),
    offer("france", "school-managed-programme", { territory_id: "fr" }),
  ],
  [publicCategory],
  ["global", "morocco", "france"].map((id) => ({
    id,
    catalog_item_id: id,
    category_id: "family",
  })),
);
result = await model.businessExposure("establishments", "fr", "MA-MASTER");
check("Territory selects matching plus global offers", () => {
  assert.deepEqual(
    result.items.map((item) => item.id),
    ["global", "morocco"],
  );
  assert.equal(result.territoryId, "ma");
});
await assert.rejects(
  () => model.businessExposure("establishments", "fr", "MISSING"),
  /Unknown/,
);
checks++;
console.log("[PASS] Unknown territory never widens silently");
globalThis.businessTestDB.failTable =
  "angelcare_marketplace_catalog_item_categories";
await assert.rejects(
  () => model.businessExposure("establishments", "fr"),
  /failed/,
);
checks++;
console.log("[PASS] Source outage never becomes an empty catalogue");
check("Brief transmission retains both message and identity", () => {
  const joined = model.appendBrief("My full message", "Offer [item-42]", 100);
  assert.equal(joined, "My full message\n\nOffer [item-42]");
  assert.equal(model.appendBrief(joined, "Offer [item-42]", 100), joined);
});
check("Brief overflow is never silently truncated", () =>
  assert(
    model.appendBrief("x".repeat(95), "Offer [item-42]", 100).length > 100,
  ),
);
check("Zero and false public facts remain meaningful", () => {
  assert.deepEqual(model.factValues(0, "fr"), ["0"]);
  assert.deepEqual(model.factValues(false, "fr"), ["Non"]);
});
check("Nested non-public object properties are omitted", () =>
  assert.deepEqual(model.factValues({ private: "sensitive" }, "fr"), []),
);
check("No explorer default is promoted to a user choice", () =>
  assert.equal(model.contextualItems([], "not-an-offer-dimension", 0), null),
);
const pathwayCourse = offer("professional-course", "academy-course");
const professionalPathway = offer(
  "professional-pathway",
  "certification-pathway",
  {
    experience_configuration: {
      component_course_keys: ["professional-course"],
    },
  },
);
const uncertainPathway = offer("uncertain-pathway", "certification-pathway", {
  experience_configuration: {
    component_course_keys: ["professional-course", "unknown-course"],
  },
});
database(
  [pathwayCourse, professionalPathway, uncertainPathway],
  [publicCategory],
  ["professional-course", "professional-pathway", "uncertain-pathway"].map(
    (id) => ({ id, catalog_item_id: id, category_id: "family" }),
  ),
);
result = await model.businessExposure("professionals", "fr");
check(
  "Professional pathway inherits only fully resolved professional components",
  () => {
    assert(result.items.some((item) => item.id === "professional-pathway"));
    assert(!result.items.some((item) => item.id === "uncertain-pathway"));
  },
);
if (process.argv.includes("--report")) {
  const output = process.argv[process.argv.indexOf("--report") + 1];
  if (!output) throw Error("--report needs a path");
  fs.writeFileSync(
    output,
    JSON.stringify(
      {
        status: "PASS",
        checks,
        scope:
          "Fixture-backed source behavior; not production catalogue certification",
      },
      null,
      2,
    ),
  );
}
console.log("BEHAVIOR_CHECKS=" + checks);
