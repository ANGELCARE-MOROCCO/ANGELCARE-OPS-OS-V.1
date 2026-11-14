/* Actual production readers and handlers, isolated from the live database. */
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const fixture = require("./fixture.cjs");
const {
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
} = fixture;
beforeEach(fixture.reset);

test("registry contains exactly the twelve existing storefront keys, with three independent establishment views", () => {
  assert.equal(new Set(model.STOREFRONTS.map((row) => row.key)).size, 12);
  assert.equal(model.ESTABLISHMENT_VIEWS.length, 3);
  const type = fs
    .readFileSync(path.join(area, "catalog-discovery/types.ts"), "utf8")
    .match(/export type StorefrontKey=([^\n]+)/)[1];
  assert.deepEqual(
    new Set([...type.matchAll(/'([^']+)'/g)].map((match) => match[1])),
    new Set(model.STOREFRONTS.map((row) => row.key)),
  );
});
test("unset configuration preserves automatic decisions; normalization discards private/unknown values", () => {
  assert.equal(model.normalizePlacement(undefined).mode, "automatic");
  const config = model.normalizePlacement({
    ...manual(["families", "unknown", "families"]),
    private: "PRIVATE_SENTINEL",
  });
  assert.deepEqual(config.storefronts, ["families"]);
  assert.ok(!JSON.stringify(config).includes("PRIVATE_SENTINEL"));
});
test("invalid destination, version, and establishment parent/view combinations are rejected", () => {
  for (const config of [
    { ...manual(["kits"]), version: 2 },
    manual(["unknown"]),
    manual(["establishments"]),
    manual(["kits"], ["conseil"]),
    { version: 1, mode: "manual" },
  ])
    assert.ok(model.validatePlacement(config).length);
  assert.deepEqual(model.validatePlacement(manual([])), []);
});
for (const views of [
  ["conseil"],
  ["partner-os", "produits"],
  ["conseil", "partner-os", "produits"],
])
  test("exact establishment membership: " + views.join(", "), () => {
    const offer = item(seed(1, manual(["establishments"], views)));
    for (const view of model.ESTABLISHMENT_VIEWS)
      assert.equal(
        model.belongsToEstablishmentView(offer, view.key),
        views.includes(view.key),
      );
    for (const view of model.ESTABLISHMENT_VIEWS)
      assert.equal(
        filterOffers([offer], {
          view: view.key,
          query: "",
          category: "all",
          availability: "all",
          sort: "recommended",
        }).length,
        views.includes(view.key) ? 1 : 0,
      );
  });
test("standalone Partner OS and establishment Partner OS are independent", () => {
  const offer = item(seed(1, manual(["partner-os"])));
  assert.equal(model.manualMembership(offer, "partner-os"), true);
  assert.equal(model.belongsToEstablishmentView(offer, "partner-os"), false);
});
test("GET supports draft offers without an atomic schema and reports actual public obstacles", async () => {
  const row = seed(1, undefined, {
    status: "draft",
    slug: "",
    experience_schema_key: null,
  });
  fixture.tables.angelcare_marketplace_catalog_item_categories = [];
  const result = await handleStorefrontPlacement(req("GET"), row.id);
  assert.equal(result.status, 200);
  assert.equal(result.data.config.mode, "automatic");
  assert.deepEqual(
    result.data.publicIssues.map((issue) => issue.code),
    ["NOT_PUBLISHED", "NO_PUBLIC_SLUG", "NO_PUBLIC_CATEGORY"],
  );
});
test("PATCH persists an optional exact set without changing the schema, categories, status or other configuration", async () => {
  const row = seed(1, undefined, {
      status: "draft",
      experience_schema_key: null,
    }),
    categories = clone(
      fixture.tables.angelcare_marketplace_catalog_item_categories,
    );
  const config = manual(
    ["families", "establishments"],
    ["conseil", "produits"],
  );
  const result = await handleStorefrontPlacement(req("PATCH", config), row.id);
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.config, config);
  assert.equal(row.experience_config.keep, "PRIVATE_SENTINEL");
  assert.equal(row.status, "draft");
  assert.equal(row.experience_schema_key, null);
  assert.deepEqual(
    fixture.tables.angelcare_marketplace_catalog_item_categories,
    categories,
  );
  assert.equal(fixture.audits.length, 1);
  assert.equal(
    new Set(fixture.invalidations.filter((path) => !path.includes("/item/")))
      .size,
    36,
  );
  const read = await handleStorefrontPlacement(req("GET"), row.id);
  assert.deepEqual(read.data.config, config);
});
test("all twelve placements and all three explorers save successfully", async () => {
  const row = seed(1),
    config = manual(
      model.STOREFRONTS.map((row) => row.key),
      model.ESTABLISHMENT_VIEWS.map((row) => row.key),
    );
  assert.equal(
    (await handleStorefrontPlacement(req("PATCH", config), row.id)).status,
    200,
  );
});
test("manual empty set excludes all; reset to automatic saves without a publication requirement", async () => {
  const row = seed(1, manual([]));
  const result = await handleStorefrontPlacement(
    req("PATCH", model.automaticPlacement()),
    row.id,
  );
  assert.equal(result.status, 200);
  assert.equal(row.experience_config.storefront_placement.mode, "automatic");
});
test("viewers can read but cannot save; anonymous users cannot read", async () => {
  const row = seed(1);
  fixture.role = "viewer";
  assert.equal(
    (await handleStorefrontPlacement(req("GET"), row.id)).data.canManage,
    false,
  );
  assert.equal(
    (await handleStorefrontPlacement(req("PATCH", manual(["kits"])), row.id))
      .status,
    403,
  );
  fixture.role = "anonymous";
  assert.equal(
    (await handleStorefrontPlacement(req("GET"), row.id)).status,
    401,
  );
  assert.equal(fixture.audits.length, 0);
});
test("cross-territory admin writes are refused", async () => {
  const row = seed(1, undefined, { territory_id: "other" });
  assert.equal(
    (await handleStorefrontPlacement(req("PATCH", manual(["kits"])), row.id))
      .status,
    403,
  );
});
test("stale versions and concurrent-write races never overwrite the stored selection", async () => {
  const row = seed(1, manual(["kits"]));
  assert.equal(
    (
      await handleStorefrontPlacement(
        req("PATCH", manual(["families"]), "stale"),
        row.id,
      )
    ).status,
    409,
  );
  fixture.race = true;
  assert.equal(
    (
      await handleStorefrontPlacement(
        req("PATCH", manual(["families"])),
        row.id,
      )
    ).status,
    409,
  );
  assert.deepEqual(
    row.experience_config.storefront_placement,
    manual(["kits"]),
  );
  assert.equal(fixture.audits.length, 0);
});
test("invalid placements never mutate the offer", async () => {
  const row = seed(1),
    before = clone(row);
  assert.equal(
    (
      await handleStorefrontPlacement(
        req("PATCH", manual(["establishments"])),
        row.id,
      )
    ).status,
    400,
  );
  assert.deepEqual(row, before);
});
for (const key of model.STOREFRONTS.map((row) => row.key))
  test(
    "actual " + key + " reader exposes a manually selected foreign-kind offer",
    async () => {
      const row = seed(
        1,
        manual(
          [key],
          key === "establishments" ? ["conseil", "partner-os", "produits"] : [],
        ),
        {
          kind: "audit",
          category_key: "kits",
          experience_schema_key: "quality-check-360",
        },
      );
      let result = await storefrontExperience({
        locale: "fr",
        key,
        territoryCode: "MA-MASTER",
      });
      if (businessKey(key)) {
        const { prepareBusinessStorefront } = require(
          path.join(area, "business-worlds/repository.ts"),
        );
        result = await prepareBusinessStorefront(result, key);
      }
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].id, row.id);
      assert.equal(result.items[0].kind, "audit");
      assert.equal(result.items[0].price_amount, 145);
      assert.equal(result.facets.kind[0].value, "audit");
      assert.ok(!JSON.stringify(result.items).includes("PRIVATE_SENTINEL"));
    },
  );
test("manual exclusions remove automatic items, featured entries and collection copies", async () => {
  const row = seed(1, manual(["academy"])),
    offer = item(row),
    original = experience("kits", [offer]);
  original.featured = [offer];
  original.collections = [{ id: "c", items: [offer] }];
  const result = await applyStorefrontPlacements(original, async () => {
    throw Error("unexpected page");
  });
  assert.equal(result.items.length, 0);
  assert.equal(result.featured.length, 0);
  assert.equal(result.collections[0].items.length, 0);
});
test("manual offers in hidden categories, drafts, restricted availability, wrong territory or without slug stay private", async () => {
  seed(1, manual(["families"]), { status: "draft" });
  seed(2, manual(["families"]), { availability_status: "hidden" });
  seed(3, manual(["families"]), { territory_id: "other" });
  seed(4, manual(["families"]), { slug: "" });
  const hidden = seed(5, manual(["families"]));
  fixture.tables.angelcare_marketplace_catalog_item_categories.find(
    (row) => row.catalog_item_id === hidden.id,
  ).category_id = "hidden-category";
  const result = await applyStorefrontPlacements(
    experience("families"),
    async () => {
      throw Error("unexpected page");
    },
  );
  assert.equal(result.items.length, 0);
});
test("locale-specific category hiding defeats fallback publication", async () => {
  seed(1, manual(["families"]));
  fixture.tables.angelcare_marketplace_catalog_categories.push({
    id: "cat-en",
    category_key: "kits",
    locale: "en",
    status: "published",
    visible: false,
    territory_id: null,
  });
  const result = await applyStorefrontPlacements(
    { ...experience("families"), locale: "en" },
    async () => {
      throw Error("unexpected page");
    },
  );
  assert.equal(result.items.length, 0);
});
test("manual merchandising bypasses business audience doctrine but retains public safeguards", async () => {
  const row = seed(1, manual(["establishments"], ["conseil"]), {
    experience_schema_key: "",
    kind: "product",
  });
  const exposure = await businessExposure("establishments", "fr", "MA-MASTER");
  assert.equal(exposure.items[0].id, row.id);
  assert.equal(
    exposure.items[0].metadata.business_storefront.reason,
    "manual_placement",
  );
  row.experience_config.storefront_placement = manual([]);
  assert.equal(
    (await businessExposure("establishments", "fr", "MA-MASTER")).items.length,
    0,
  );
});
test("family and home-service component selectors preserve explicitly placed foreign kinds", () => {
  const offer = item(
    seed(1, manual(["families", "home-services"]), {
      kind: "training",
      experience_schema_key: "professional-training",
    }),
  );
  assert.equal(isFamilyOffer(offer), true);
  assert.equal(isHomeServiceOffer(offer), true);
  assert.equal(
    selectHomeServices([offer], readServiceFilters(), "fr").length,
    1,
  );
  offer.metadata.storefront_placement = manual([]);
  assert.equal(isFamilyOffer(offer), false);
  assert.equal(isHomeServiceOffer(offer), false);
});
test("native pagination completes before removals and additions; a resolved catalogue cannot be repopulated", async () => {
  const original = Array.from({ length: 120 }, (_, n) =>
      item({ ...seed(n + 1), name_fr: "Auto " + n }),
    ),
    remaining = [item(seed(121))];
  const removed = original[0];
  fixture.tables.angelcare_marketplace_catalog_items[0].experience_config.storefront_placement =
    manual([]);
  const extra = seed(122, manual(["kits"])),
    calls = [];
  const result = await applyStorefrontPlacements(
    experience("kits", original),
    async (input) => {
      calls.push(input.offset);
      return { items: remaining, total: 121 };
    },
  );
  assert.deepEqual(calls, [120]);
  assert.equal(result.items.length, 121);
  assert.ok(!result.items.some((item) => item.id === removed.id));
  assert.ok(result.items.some((item) => item.id === extra.id));
  const { completeStorefront } = require(
    path.join(area, "storefront-immersive/pagination.ts"),
  );
  assert.equal(
    await completeStorefront(result, async () => {
      throw Error("must not read native pages again");
    }),
    result,
  );
});
test("publication read failures surface as failures instead of an empty successful catalogue", async () => {
  seed(1, manual(["families"]));
  fixture.failTable = "angelcare_marketplace_catalog_items";
  await assert.rejects(
    () => applyStorefrontPlacements(experience("families"), async () => {}),
    /Impossible/,
  );
});

test("automatic mode preserves native family eligibility and the original establishment split", () => {
  const product = item(seed(1)),
    service = {
      ...product,
      id: uuid(2),
      kind: "service",
      metadata: { experience_schema_key: "home-childcare-one-time" },
    },
    plan = {
      ...product,
      id: uuid(3),
      kind: "saas_module",
      metadata: { experience_schema_key: "partner-os-plan" },
    };
  assert.equal(model.manualMembership(product, "families"), undefined);
  assert.equal(isFamilyOffer(product), true);
  assert.equal(model.belongsToEstablishmentView(product, "produits"), true);
  assert.equal(model.belongsToEstablishmentView(product, "conseil"), false);
  assert.equal(model.belongsToEstablishmentView(service, "conseil"), true);
  assert.equal(model.belongsToEstablishmentView(plan, "partner-os"), true);
});
test("existing automatic collection recommendations outside the explorer remain intact", async () => {
  const row = seed(1),
    offer = item(row),
    original = experience("academy");
  original.collections = [{ id: "native-recommendations", items: [offer] }];
  const result = await applyStorefrontPlacements(original, async () => {
    throw Error("unexpected page");
  });
  assert.equal(result.items.length, 0);
  assert.equal(result.collections[0].items[0].id, offer.id);
});
test("more than 500 manual offers are discovered, category-checked, and deduplicated without truncation", async () => {
  for (let n = 1; n <= 501; n++) seed(n, manual(["kits"]));
  const result = await applyStorefrontPlacements(
    experience("kits"),
    async () => {
      throw Error("unexpected page");
    },
  );
  assert.equal(result.items.length, 501);
  assert.equal(new Set(result.items.map((item) => item.id)).size, 501);
  assert.equal(result.facets.kind[0].count, 501);
});
test("unknown visitor territory cannot expose a territory-specific manual offer", async () => {
  seed(1, manual(["kits"]));
  const result = await applyStorefrontPlacements(
    { ...experience("kits"), territoryCode: "UNKNOWN" },
    async () => {
      throw Error("unexpected page");
    },
  );
  assert.equal(result.items.length, 0);
});
test("explicitly global offers in global published categories remain available in an unknown territory", async () => {
  const row = seed(1, manual(["kits"]), {
    territory_id: null,
    territory_code: null,
  });
  const result = await applyStorefrontPlacements(
    { ...experience("kits"), territoryCode: "UNKNOWN" },
    async () => {
      throw Error("unexpected page");
    },
  );
  assert.equal(result.items[0].id, row.id);
});
test("saved revisions advance even when the wall clock is behind the previous revision", async () => {
  const future = "2099-01-01T00:00:00.000Z",
    row = seed(1, undefined, { updated_at: future });
  const result = await handleStorefrontPlacement(
    req("PATCH", manual(["kits"]), future),
    row.id,
  );
  assert.equal(result.status, 200);
  assert.ok(Date.parse(result.data.updatedAt) > Date.parse(future));
});
test("admin read-back includes the offer territory for precise preview links", async () => {
  const row = seed(1);
  const result = await handleStorefrontPlacement(req("GET"), row.id);
  assert.equal(result.data.territoryCode, "MA-MASTER");
});

test("commercial metadata cannot impersonate the authoritative placement setting", () => {
  const { mapDiscoveryItem } = require(
    path.join(area, "catalog-discovery/public-item.ts"),
  );
  const row = seed(1, undefined, {
    commercial_metadata: { storefront_placement: manual(["academy"]) },
  });
  assert.equal(
    mapDiscoveryItem(row, "fr").metadata.storefront_placement.mode,
    "automatic",
  );
});
