#!/usr/bin/env node
// Offline behavior checks; no database writes, credentials, network or production build.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(app, "package.json"));
const ts = require("typescript");
const base = path.join(app, "angelcare-marketplace");
const compiled = new Map();
function moduleAt(file, overrides = {}) {
  if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file, "utf8"));
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    reportDiagnostics: true,
  });
  assert.equal(
    output.diagnostics?.filter(
      (d) => d.category === ts.DiagnosticCategory.Error,
    ).length || 0,
    0,
    file,
  );
  const mod = { exports: {} };
  new Function("require", "module", "exports", output.outputText)(
    (name) => {
      if (name in overrides) return overrides[name];
      if (name === "server-only") return {};
      if (name === "react") return { ...require("react"), cache: (fn) => fn };
      if (name === "react/jsx-runtime") return require(name);
      if (name === "next/link")
        return {
          __esModule: true,
          default: (props) => require("react").createElement("a", props),
        };
      if (name.endsWith(".module.css"))
        return { __esModule: true, default: {} };
      if (name.startsWith(".")) {
        const raw = path.resolve(path.dirname(file), name);
        const next = ["", ".ts", ".tsx", ".json"]
          .map((ext) => raw + ext)
          .find((p) => fs.existsSync(p));
        assert(next, "Missing dependency " + name);
        if (!compiled.has(next)) compiled.set(next, moduleAt(next, overrides));
        return compiled.get(next);
      }
      throw Error("Unexpected dependency: " + name);
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const policy = moduleAt(path.join(base, "compliance/legal-policy.ts"));
let checks = 0;
async function test(label, work) {
  await work();
  checks++;
  console.log("[PASS]", label);
}
const row = (more = {}) => ({
  id: "a",
  slug: "legal/terms",
  locale: "fr",
  territory_id: null,
  publication_state: "published",
  ...more,
});
const select = (rows, kind = "terms", locale = "fr", territory = "ma") =>
  policy.selectLegalCandidate(kind, locale, territory, rows);
await test("Canonical published document is eligible", () =>
  assert.equal(select([row()]).status, "candidate"));
for (const state of ["draft", "unpublished", "archived", "scheduled"])
  await test(`Explicit ${state} cannot inherit legacy published status`, () =>
    assert.equal(
      select([row({ publication_state: state, status: "published" })]).status,
      "missing",
    ));
await test("Legacy published record remains discoverable", () =>
  assert.equal(
    select([row({ publication_state: undefined, status: "published" })]).status,
    "candidate",
  ));
await test("Unpublished legacy record is excluded", () =>
  assert.equal(
    select([row({ publication_state: undefined, status: "draft" })]).status,
    "missing",
  ));
await test("Privacy aliases preserve their document identity", () =>
  assert.equal(
    select([row({ slug: "politique-de-confidentialite" })], "privacy").status,
    "candidate",
  ));
await test("Terms do not consume privacy or sales conditions", () =>
  assert.equal(
    select([row({ slug: "cgv" }), row({ id: "b", slug: "legal/privacy" })])
      .status,
    "missing",
  ));
await test("Other territories are excluded", () =>
  assert.equal(select([row({ territory_id: "other" })]).status, "missing"));
await test("Unknown territory does not widen scope", () =>
  assert.equal(
    select([row({ territory_id: "ma" })], "terms", "fr", null).status,
    "missing",
  ));
await test("Global published document remains available", () =>
  assert.equal(select([row()], "terms", "fr", null).status, "candidate"));
await test("Territory authority ranks above global", () =>
  assert.equal(
    select([row(), row({ id: "ma", territory_id: "ma" })]).page.id,
    "ma",
  ));
await test("Canonical authority ranks above alias", () =>
  assert.equal(
    select([row(), row({ id: "alias", slug: "terms" })]).page.id,
    "a",
  ));
await test("Equal published authorities are reported ambiguous", () =>
  assert.equal(select([row(), row({ id: "b" })]).status, "ambiguous"));
await test("Multiple discovery associations do not duplicate candidates", () =>
  assert.equal(select([row(), row()]).status, "candidate"));
await test("Published locale and territory override mutable metadata", () =>
  assert.equal(
    select([
      row({
        locale: "en",
        territory_id: "other",
        published_locale: "fr",
        published_territory_id: null,
      }),
    ]).status,
    "candidate",
  ));
await test("Other language never silently becomes a match", () =>
  assert.equal(select([row({ locale: "en" })]).status, "missing"));
let scenario, calls;
function database() {
  return {
    from(table) {
      const filters = [],
        chain = {
          select() {
            return chain;
          },
          in(key, values) {
            filters.push([key, values]);
            return chain;
          },
          eq(key, value) {
            filters.push([key, value]);
            return chain;
          },
          order() {
            return chain;
          },
          range(start, end) {
            chain.slice = [start, end];
            return chain;
          },
          maybeSingle() {
            return chain;
          },
          then(resolve, reject) {
            calls.push({ table, filters });
            let result;
            if (scenario.failure)
              result = {
                data: null,
                error: { code: "XX000", message: "PRIVATE TEST ERROR" },
              };
            else if (table.endsWith("_territories"))
              result = { data: { id: "ma" }, error: null };
            else if (table.endsWith("_revisions"))
              result = {
                data: scenario.revision || null,
                error: scenario.revisionError || null,
              };
            else if (table.endsWith("_blocks"))
              result = { data: [{ id: "mutable", content: {} }], error: null };
            else if (
              scenario.legacyColumn &&
              filters.some(([k]) => k === "published_slug")
            )
              result = { data: null, error: { code: "42703" } };
            else
              result = {
                data: (scenario.rows || [])
                  .filter((r) =>
                    filters.every(([k, v]) =>
                      Array.isArray(v) ? v.includes(r[k]) : r[k] === v,
                    ),
                  )
                  .slice(
                    ...[chain.slice?.[0] || 0, (chain.slice?.[1] ?? 99) + 1],
                  ),
                error: null,
              };
            return Promise.resolve(result).then(resolve, reject);
          },
        };
      return chain;
    },
  };
}
const dbOverride = {
  "@/lib/supabase/server": { createServiceClient: async () => database() },
};
class MarketplaceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const shared = moduleAt(path.join(base, "public-universe/repository.ts"), {
  ...dbOverride,
  "../server/errors": { MarketplaceError },
  "../studio-universal/database-error": {
    marketplaceDatabaseError: () => new Error("SAFE DATABASE FAILURE"),
  },
  "../homepage-living-marketplace/world": {
    isLivingMarketplaceComponent: () => false,
  },
});
const resolver = moduleAt(path.join(base, "compliance/legal-repository.ts"), {
  ...dbOverride,
  "../public-universe/repository": shared,
});
const reset = (data) => {
  scenario = data;
  calls = [];
};
const revision = (page = {}) => ({
  page_snapshot: { slug: "legal/terms", locale: "fr", ...page },
  document: {
    blocks: [
      {
        id: "published-block",
        block_key: "root",
        status: "active",
        block_type: "editorial",
        content: { body: "APPROVED BODY" },
      },
    ],
  },
});
await test("Exact immutable revision supplies legal body", async () => {
  reset({ revision: revision() });
  const value = await shared.loadPublishedExperience(
    row({ published_revision_id: "rev" }),
    { requirePublishedRevision: true },
  );
  assert.equal(value.blocks[0].id, "published-block");
  assert.deepEqual(calls.find((c) => c.table.endsWith("_revisions")).filters, [
    ["id", "rev"],
    ["page_id", "a"],
  ]);
});
await test("Strict legal loader refuses mutable legacy blocks", async () => {
  reset({});
  await assert.rejects(
    shared.loadPublishedExperience(
      row({ publication_state: undefined, status: "published" }),
      { requirePublishedRevision: true },
    ),
  );
  assert(!calls.some((c) => c.table.endsWith("_blocks")));
});
await test("Existing nonlegal legacy behavior remains unchanged", async () => {
  reset({});
  const value = await shared.loadPublishedExperience(
    row({ publication_state: undefined, status: "published" }),
  );
  assert.equal(value.blocks[0].id, "mutable");
});
await test("Modern broken publication never reads mutable blocks", async () => {
  reset({});
  await assert.rejects(shared.loadPublishedExperience(row()));
  assert(!calls.some((c) => c.table.endsWith("_blocks")));
});
await test("Published revision number remains supported", async () => {
  reset({ revision: revision() });
  await shared.loadPublishedExperience(row({ published_version: 2 }), {
    requirePublishedRevision: true,
  });
  assert(
    calls.some((c) =>
      c.filters.some(([k, v]) => k === "revision_number" && v === 2),
    ),
  );
});
await test("Missing document is distinct from source outage", async () => {
  reset({ rows: [] });
  assert.equal(
    (await resolver.resolvePublishedLegal("terms", "fr")).status,
    "missing",
  );
});
await test("French published fallback resolves for English", async () => {
  reset({
    rows: [row({ published_revision_id: "rev" })],
    revision: revision(),
  });
  const value = await resolver.resolvePublishedLegal("terms", "en");
  assert.equal(value.status, "published");
  assert.equal(value.sourceLocale, "fr");
});
await test("Old schema candidate discovery remains supported", async () => {
  reset({
    legacyColumn: true,
    rows: [
      row({
        publication_state: undefined,
        status: "published",
        published_revision_id: "rev",
      }),
    ],
    revision: revision(),
  });
  assert.equal(
    (await resolver.resolvePublishedLegal("terms", "fr")).status,
    "published",
  );
});
const errors = [],
  originalError = console.error;
console.error = (...items) => errors.push(items.join(" "));
try {
  await test("Database failure becomes unavailable, never empty catalogue or 404", async () => {
    reset({ failure: true });
    assert.equal(
      (await resolver.resolvePublishedLegal("terms", "fr")).status,
      "unavailable",
    );
  });
  await test("Unresolvable publication becomes unavailable", async () => {
    reset({ rows: [row()] });
    assert.equal(
      (await resolver.resolvePublishedLegal("terms", "fr")).status,
      "unavailable",
    );
  });
  await test("Ambiguous authority is never guessed", async () => {
    reset({ rows: [row(), row({ id: "b" })] });
    assert.equal(
      (await resolver.resolvePublishedLegal("terms", "fr")).reason,
      "LEGAL_PUBLISHED_AUTHORITY_AMBIGUOUS",
    );
  });
  await test("Immutable document purpose is checked", async () => {
    reset({
      rows: [row({ published_revision_id: "rev" })],
      revision: revision({ slug: "legal/privacy" }),
    });
    assert.equal(
      (await resolver.resolvePublishedLegal("terms", "fr")).reason,
      "LEGAL_PUBLISHED_SNAPSHOT_MISMATCH",
    );
  });
  await test("Immutable territory must match the selected authority", async () => {
    reset({
      rows: [row({ published_revision_id: "rev" })],
      revision: revision({ territory_id: "other" }),
    });
    assert.equal(
      (await resolver.resolvePublishedLegal("terms", "fr")).reason,
      "LEGAL_PUBLISHED_SNAPSHOT_MISMATCH",
    );
  });
  await test("Empty or hidden-only document is unavailable", async () => {
    const r = revision();
    r.document.blocks[0].status = "hidden";
    reset({ rows: [row({ published_revision_id: "rev" })], revision: r });
    assert.equal(
      (await resolver.resolvePublishedLegal("terms", "fr")).reason,
      "LEGAL_PUBLISHED_DOCUMENT_EMPTY",
    );
  });
  await test("Operational logs omit raw database error details", () =>
    assert(!errors.join(" ").includes("PRIVATE TEST ERROR")));
} finally {
  console.error = originalError;
}
for (const kind of ["terms", "privacy", "cookies"])
  await test(`${kind} has a dedicated canonical dynamic route`, () => {
    const source = fs.readFileSync(
      path.join(
        app,
        "app/angelcare-marketplace/[locale]/legal",
        kind,
        "page.tsx",
      ),
      "utf8",
    );
    assert(source.includes("'force-dynamic'"));
    assert(source.includes(`kind="${kind}"`));
  });
await test("Candidate discovery reads past the second page", async () => {
  reset({
    rows: [
      ...Array.from({ length: 205 }, (_, i) =>
        row({ id: "alias-" + i, slug: "terms" }),
      ),
      row({ published_revision_id: "rev" }),
    ],
    revision: revision(),
  });
  assert.equal(
    (await resolver.resolvePublishedLegal("terms", "fr")).status,
    "published",
  );
  assert(
    calls.filter((c) => c.filters.some(([k]) => k === "slug")).length >= 3,
  );
});
const jsx = require("react/jsx-runtime"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
let publicResult;
const ui = moduleAt(path.join(base, "compliance/LegalPage.tsx"), {
  "react/jsx-runtime": jsx,
  "next/link": {
    __esModule: true,
    default: (props) => React.createElement("a", props),
  },
  "./legal.module.css": { __esModule: true, default: {} },
  "./legal-repository": { resolvePublishedLegal: async () => publicResult },
  "../public-universe/components/GlobalPublicShell": {
    GlobalPublicShell: (props) => props.children,
  },
  "../public-universe/components/PublicPageRenderer": {
    PublicPageRenderer: () => React.createElement("p", null, "APPROVED BODY"),
  },
});
for (const status of ["missing", "unavailable"])
  for (const kind of ["terms", "privacy", "cookies"])
    for (const locale of ["fr", "en", "ar"])
      await test(`${kind}/${locale}/${status} renders native web content without an uploaded document`, async () => {
        publicResult = { status, reason: "TEST" };
        const html = renderToStaticMarkup(
          await ui.AngelCareLegalPage({ kind, locale }),
        );
        assert(html.includes('data-ac-policy-source="native-web"'));
        assert((html.match(/<section/g) || []).length >= 6);
        assert(html.includes(`/angelcare-marketplace/${locale}/contact`));
        assert(!html.includes("APPROVED BODY"));
        assert(!html.includes("<iframe"));
        assert(!html.includes("<object"));
        assert(!html.includes("Document officiel indisponible"));
        const metadata = await ui.legalMetadata(kind, locale);
        assert.equal(
          metadata.alternates.canonical,
          `/angelcare-marketplace/${locale}/legal/${kind}`,
        );
        assert.equal(Object.keys(metadata.alternates.languages).length, 3);
        if (status === "unavailable") {
          assert.equal(metadata.robots.index, false);
          assert(html.includes('role="status"'));
        } else assert.equal(metadata.robots, undefined);
        if (locale === "ar") assert(html.includes('dir="rtl"'));
        const ids = [
          ...html.matchAll(/id="(terms|privacy|cookies)-([0-9]+)"/g),
        ].map((m) => m[1] + "-" + m[2]);
        assert.equal(new Set(ids).size, ids.length);
        assert(ids.length >= 5);
      });
await test("Published fallback renders the approved body and language disclosure", async () => {
  publicResult = {
    status: "published",
    sourceLocale: "fr",
    experience: {
      page: { title: "Approved terms" },
      navigation: [],
      blocks: [],
    },
  };
  const html = renderToStaticMarkup(
    await ui.AngelCareLegalPage({ kind: "terms", locale: "en" }),
  );
  assert(html.includes("APPROVED BODY"));
  assert(html.includes("French version"));
  assert(html.includes('lang="fr"'));
  assert.equal(
    (await ui.legalMetadata("terms", "en")).alternates.canonical,
    "/angelcare-marketplace/en/legal/terms",
  );
});
for (const kind of ["terms", "privacy", "cookies"])
  await test(`${kind} route accepts all supported locales and rejects invalid locale`, async () => {
    const route = moduleAt(
      path.join(
        app,
        "app/angelcare-marketplace/[locale]/legal",
        kind,
        "page.tsx",
      ),
      {
        "react/jsx-runtime": jsx,
        "next/navigation": {
          notFound() {
            throw Error("NOT_FOUND");
          },
        },
        "@/angelcare-marketplace/compliance/LegalPage": {
          AngelCareLegalPage: () => null,
          legalMetadata: async (kind, locale) => ({ kind, locale }),
        },
      },
    );
    for (const locale of ["fr", "en", "ar"]) {
      const props = { params: Promise.resolve({ locale }) };
      assert.equal((await route.default(props)).props.locale, locale);
      assert.equal((await route.generateMetadata(props)).kind, kind);
    }
    await assert.rejects(
      route.default({ params: Promise.resolve({ locale: "xx" }) }),
      /NOT_FOUND/,
    );
  });
for (const kind of ["terms", "privacy", "cookies"])
  await test(kind + " has typed aliases to its canonical page", () => {
    for (const slug of policy.LEGAL_IDENTITIES[kind].slugs)
      assert.equal(policy.canonicalLegalAlias(slug), "legal/" + kind);
  });
await test("Other CMS routes do not become legal documents", () => {
  assert.equal(policy.canonicalLegalAlias("about"), null);
  assert.equal(policy.canonicalLegalAlias("cgv"), null);
});
await test("Hidden parent cannot expose its child as a root", () => {
  const blocks = [
    { block_key: "hidden", status: "hidden", content: {} },
    {
      block_key: "child",
      parent_block_key: "hidden",
      status: "active",
      content: { body: "HIDDEN CHILD" },
    },
    { block_key: "visible", status: "active", content: { body: "PUBLIC" } },
  ];
  assert.deepEqual(
    resolver.visibleLegalBlocks(blocks).map((b) => b.block_key),
    ["visible"],
  );
});
await test("Orphan and cyclic legal blocks are excluded", () => {
  const b = [
    { block_key: "a", parent_block_key: "b", status: "active" },
    { block_key: "b", parent_block_key: "a", status: "active" },
    { block_key: "orphan", parent_block_key: "unknown", status: "active" },
  ];
  assert.equal(resolver.visibleLegalBlocks(b).length, 0);
});
await test("Empty published heading cannot replace readable policy", () => {
  assert.equal(
    resolver.hasLegalMaterial([
      { block_type: "hero", content: { title: "Terms" } },
    ]),
    false,
  );
  assert.equal(
    resolver.hasLegalMaterial([
      { block_type: "editorial", content: { body: "Approved terms" } },
    ]),
    true,
  );
});
await test("Published document download remains supported without automatic publication", () =>
  assert(
    resolver.hasLegalMaterial([
      { block_type: "download", content: { href: "/approved/document.pdf" } },
    ]),
  ));
await test("Cookies are independent of Terms and Privacy identity", () => {
  assert.equal(
    select([row({ slug: "cookies" })], "cookies").status,
    "candidate",
  );
  assert.equal(
    select([row({ slug: "legal/privacy" })], "cookies").status,
    "missing",
  );
});
const native = moduleAt(path.join(base, "compliance/web-policy.ts"));
for (const locale of ["fr", "en", "ar"])
  await test(
    locale + " native content includes actual Terms Privacy and Cookies text",
    () => {
      assert(native.webPolicy("terms", locale).sections.length >= 9);
      assert(native.webPolicy("privacy", locale).sections.length >= 11);
      assert(native.webPolicy("cookies", locale).sections.length >= 5);
    },
  );
await test("All public policy links use canonical routes", () => {
  const c = fs.readFileSync(
    path.join(base, "compliance/NativePolicyDocument.tsx"),
    "utf8",
  );
  assert(c.includes("legalPath"));
  assert(!c.includes("dangerouslySetInnerHTML"));
});
for (const kind of ["terms", "privacy", "cookies"])
  for (const locale of ["fr", "en", "ar"])
    await test(`${kind}/${locale} published native text wins without attachments`, async () => {
      const approved = revision({ slug: "legal/" + kind, locale });
      reset({
        rows: [
          row({ slug: "legal/" + kind, locale, published_revision_id: "rev" }),
        ],
        revision: approved,
      });
      const result = await resolver.resolvePublishedLegal(kind, locale);
      assert.equal(result.status, "published");
      assert.equal(result.sourceLocale, locale);
      assert(!calls.some((c) => c.table.endsWith("_media_assets")));
      publicResult = result;
      const html = renderToStaticMarkup(
        await ui.AngelCareLegalPage({ kind, locale }),
      );
      assert(html.includes("APPROVED BODY"));
      assert(!html.includes('data-ac-policy-source="native-web"'));
    });
await test("Catch-all legal adapter is surgical and leaves all other routing code unchanged", () => {
  const catchall = fs.readFileSync(
    path.join(app, "app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx"),
    "utf8",
  );
  assert(
    catchall.includes(
      "return canonicalLegalAlias(slug) || legacyRouteAliases[locale][slug] || null",
    ),
  );
  assert(catchall.includes("if (alias) permanentRedirect"));
});
await test("Stalled CMS reads have a bounded native fallback", async () => {
  const result = await resolver.resolveLegalWithin(new Promise(() => {}), 5);
  assert.equal(result.status, "unavailable");
  assert.equal(result.reason, "LEGAL_PUBLISHED_DOCUMENT_TIMEOUT");
});
console.log("LEGAL_WEB_BEHAVIOR_CHECKS=" + checks);
