/* Executes production TS modules against an in-memory Supabase contract. No live database writes. */
const fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module");
const ts = require("typescript");
const app = path.resolve(__dirname, "../.."),
  area = path.join(app, "angelcare-marketplace");
let tables, role, scope, audits, invalidations, failTable, race;
const clone = (value) => JSON.parse(JSON.stringify(value));
const readPath = (row, key) =>
  key.split(/->>?/).reduce((value, part) => value?.[part], row);
class Query {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orders = [];
    this.offset = 0;
    this.end = Infinity;
    this.values = null;
    this.single = false;
  }
  select() {
    return this;
  }
  eq(key, value) {
    this.filters.push((row) => readPath(row, key) === value);
    return this;
  }
  in(key, values) {
    this.filters.push((row) => values.includes(row[key]));
    return this;
  }
  is(key, value) {
    this.filters.push((row) => (row[key] ?? null) === value);
    return this;
  }
  contains(key, values) {
    this.filters.push((row) =>
      values.every((value) => (row[key] || []).includes(value)),
    );
    return this;
  }
  or(expression) {
    const clauses = expression.split(",");
    this.filters.push((row) =>
      clauses.some((clause) => {
        const [key, op, ...parts] = clause.split(".");
        return op === "is"
          ? (row[key] ?? null) === null
          : String(row[key]) === parts.join(".");
      }),
    );
    return this;
  }
  order(key, options = {}) {
    this.orders.push([key, options.ascending !== false]);
    return this;
  }
  range(start, end) {
    this.offset = start;
    this.end = end;
    return this;
  }
  update(values) {
    this.values = values;
    return this;
  }
  maybeSingle() {
    this.single = true;
    return this;
  }
  then(resolve, reject) {
    try {
      if (failTable === this.table)
        return Promise.resolve({
          data: null,
          error: { message: "fixture read failure" },
        }).then(resolve, reject);
      if (this.values && race) {
        race = false;
        return Promise.resolve({ data: null, error: null }).then(
          resolve,
          reject,
        );
      }
      let data = (tables[this.table] || []).filter((row) =>
          this.filters.every((filter) => filter(row)),
        ),
        count = data.length;
      data = [...data]
        .sort((a, b) => {
          for (const [key, asc] of this.orders) {
            const n = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
            if (n) return n * (asc ? 1 : -1);
          }
          return 0;
        })
        .slice(this.offset, this.end + 1);
      if (this.values)
        data.forEach((row) => Object.assign(row, clone(this.values)));
      return Promise.resolve({
        data: clone(this.single ? data[0] || null : data),
        error: null,
        count,
      }).then(resolve, reject);
    } catch (error) {
      return Promise.reject(error).then(resolve, reject);
    }
  }
}
const db = { from: (table) => new Query(table) };
const originalLoad = Module._load,
  originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(
    this,
    request.startsWith("@/") ? path.join(app, request.slice(2)) : request,
    parent,
    ...rest,
  );
};
Module._load = function (request, parent, ...rest) {
  if (request === "server-only") return {};
  if (request === "react")
    return {
      ...originalLoad.call(this, request, parent, ...rest),
      cache: (fn) => fn,
    };
  const resolved = Module._resolveFilename(request, parent);
  if (resolved === path.join(app, "lib/supabase/server.ts"))
    return { createServiceClient: async () => db };
  if (resolved === path.join(area, "auth/context.ts"))
    return {
      hasMarketplacePermission: () => role === "manager",
      requireMarketplaceApiContext: async (permission) => {
        if (
          role === "anonymous" ||
          (permission.endsWith(".manage") && role !== "manager")
        ) {
          const { MarketplaceError } = originalLoad.call(
            this,
            path.join(area, "server/errors.ts"),
            parent,
          );
          throw new MarketplaceError(
            role === "anonymous" ? "AUTHENTICATION_REQUIRED" : "FORBIDDEN",
            "Accès refusé",
          );
        }
        return { territoryId: scope };
      },
    };
  if (resolved === path.join(area, "audit/write-audit.ts"))
    return { writeMarketplaceAudit: async (entry) => audits.push(entry) };
  if (resolved === path.join(area, "commerce-studio/publication.ts"))
    return { refreshCommerceSurfaces: (paths) => invalidations.push(...paths) };
  if (resolved === path.join(area, "server/request.ts"))
    return {
      requestId: () => "test-request",
      parseJsonObject: async (request) => request.json(),
      apiSuccess: (data) => ({ status: 200, data }),
      apiFailure: (error) => ({
        status: error.status || 500,
        error: { code: error.code || "INTERNAL_ERROR", message: error.message },
      }),
    };
  if (resolved === path.join(area, "total-commerce-control/repository.ts"))
    return {
      expandDiscoveryQuery: async (query) => ({ query }),
      listSearchRules: async () => [],
    };
  return originalLoad.call(this, request, parent, ...rest);
};
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    }).outputText,
    file,
  );
const model = require(path.join(area, "storefront-placement/model.ts"));
const { handleStorefrontPlacement } = require(
  path.join(area, "storefront-placement/api.ts"),
);
const { applyStorefrontPlacements } = require(
  path.join(area, "storefront-placement/repository.ts"),
);
const { businessExposure } = require(
  path.join(area, "business-worlds/repository.ts"),
);
const { isFamilyOffer } = require(
  path.join(area, "families-storefront/experience.ts"),
);
const { isHomeServiceOffer, selectHomeServices, readServiceFilters } = require(
  path.join(area, "home-services-storefront/experience.ts"),
);
const { filterOffers } = require(
  path.join(area, "establishments-world/model.ts"),
);
const { storefrontExperience } = require(
  path.join(area, "catalog-discovery/repository.ts"),
);
const { businessKey } = require(
  path.join(area, "business-worlds/merchandising.ts"),
);
const uuid = (n) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const manual = (storefronts, views = []) => ({
  version: 1,
  mode: "manual",
  storefronts,
  establishmentViews: views,
});
function seed(n, config, extra = {}) {
  const row = {
    id: uuid(n),
    slug: "offer-" + n,
    item_key: "offer-" + n,
    name_fr: "Offre " + n,
    name_en: "Offer " + n,
    name_ar: "عرض " + n,
    status: "published",
    territory_id: "ma",
    territory_code: "MA-MASTER",
    updated_at: "2026-01-01T00:00:00.000Z",
    kind: "product",
    price_mode: "fixed",
    price_amount: 145,
    currency_label: "Dh",
    availability_status: "available",
    category_key: "kits",
    experience_schema_key: "flashcards-learning-product",
    experience_configuration: {},
    attributes: {},
    commercial_metadata: {},
    experience_config: {
      keep: "PRIVATE_SENTINEL",
      ...(config ? { storefront_placement: config } : {}),
    },
    ...extra,
  };
  tables.angelcare_marketplace_catalog_items.push(row);
  tables.angelcare_marketplace_catalog_discovery_v.push({
    ...clone(row),
    experience_config: undefined,
  });
  tables.angelcare_marketplace_catalog_discovery_memberships_v.push({
    ...clone(row),
    experience_config: undefined,
    assigned_category_key: row.category_key,
  });
  tables.angelcare_marketplace_catalog_item_categories.push({
    id: "membership-" + n,
    catalog_item_id: row.id,
    category_id: "cat-kits",
  });
  return row;
}
const item = (row) => ({
  id: row.id,
  slug: row.slug,
  item_key: row.item_key,
  name: row.name_fr,
  kind: row.kind,
  public_reference: "",
  price_mode: row.price_mode,
  price_amount: row.price_amount,
  currency_label: "Dh",
  availability_status: row.availability_status,
  category_key: row.category_key,
  category_title: "Kits",
  featured: false,
  media_url: null,
  description: null,
  short_description: null,
  territory_id: row.territory_id,
  trust_labels: [],
  metadata: {
    experience_schema_key: row.experience_schema_key,
    ...(row.experience_config?.storefront_placement
      ? { storefront_placement: row.experience_config.storefront_placement }
      : {}),
  },
});
const experience = (key, items = []) => ({
  locale: "fr",
  key,
  territoryCode: "MA-MASTER",
  territoryId: "ma",
  category: null,
  hero: { eyebrow: "", title: "", lead: "", visualTheme: "" },
  items,
  featured: [],
  collections: [],
  facets: {},
});
const req = (method, config, version = "2026-01-01T00:00:00.000Z") =>
  new Request("https://test/api", {
    method,
    ...(method === "PATCH"
      ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ expectedUpdatedAt: version, config }),
        }
      : {}),
  });
function reset() {
  tables = {
    angelcare_marketplace_catalog_items: [],
    angelcare_marketplace_catalog_discovery_v: [],
    angelcare_marketplace_catalog_discovery_memberships_v: [],
    angelcare_marketplace_catalog_categories: [
      {
        id: "cat-kits",
        category_key: "kits",
        locale: "fr",
        status: "published",
        visible: true,
        territory_id: null,
      },
    ],
    angelcare_marketplace_catalog_item_categories: [],
    angelcare_marketplace_territories: [
      { id: "ma", territory_code: "MA-MASTER" },
    ],
    angelcare_marketplace_category_discovery_v: [],
    angelcare_marketplace_catalog_collections_v: [],
  };
  role = "manager";
  scope = "ma";
  audits = [];
  invalidations = [];
  failTable = null;
  race = false;
}

module.exports = {
  reset,
  app,
  area,
  clone,
  model,
  handleStorefrontPlacement,
  applyStorefrontPlacements,
  businessExposure,
  isFamilyOffer,
  isHomeServiceOffer,
  selectHomeServices,
  readServiceFilters,
  filterOffers,
  storefrontExperience,
  businessKey,
  uuid,
  manual,
  seed,
  item,
  experience,
  req,
  get tables() {
    return tables;
  },
  get role() {
    return role;
  },
  set role(value) {
    role = value;
  },
  get scope() {
    return scope;
  },
  set scope(value) {
    scope = value;
  },
  get audits() {
    return audits;
  },
  get invalidations() {
    return invalidations;
  },
  set failTable(value) {
    failTable = value;
  },
  set race(value) {
    race = value;
  },
};
