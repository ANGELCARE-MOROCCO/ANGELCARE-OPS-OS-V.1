# SANILA Public World Studio 360 — Declarative package contract

## Activation
Install the Marketplace source release. No additional database migration is required: SANILA World uses the existing `angelcare_marketplace_configurations` row `sanila.world.sovereign.v1`. The existing database permissions and native media APIs must be available.

## Operator route
- Pages: `/angelcare-marketplace/admin/sanila/pages`
- Themes: `/angelcare-marketplace/admin/sanila/themes`
- Editor: `/angelcare-marketplace/admin/sanila/studio`
- Import: `/angelcare-marketplace/admin/sanila/public-world`
- Navigation, SEO, Shell, Publication and private Preview: existing SANILA administration

## Import contract
Upload a `sanila-package.json` directly or a ZIP containing that file. JSON object must use `format: "sanila-world-package"`, `version: 1`, `pages: []`, `themes: []`, optionally `assets: [{path:"images/name.png"}]`. Pages may contain inline Puck `data` or a `path` to a JSON document within ZIP. Themes may also use paths. Browser inspects and hashes file contents, extracts supported declarative JSON only, then posts validated content to the governed SANILA World API. Executable source code and arbitrary HTML are never executed. Use the native Media Vault upload permission for PNG asset references.

See `sanila-package.example.json` for a production-safe starter. Importing does not publish.

## Publication
Saving page data updates the draft. Publishing snapshots page data, theme definitions, shell settings and publishable navigation. Public resolution gives the new snapshot precedence on eligible FR SANILA routes, falling back to the existing 29-page React source. The protected demo, contact, onboarding and login pages always retain their native component authority. Rollback uses up to four stored release snapshots.

## Data and operational guards
- Optimistic configuration version compare-and-swap
- 3 MB maximum JSON world size
- 80 maximum sections per page, 60 pages per package, 30 themes per package
- Strict block allowlist and bounded text
- Theme contrast >=4.5 for editable themes
- Native media reference check at import/publication
- System pages and system themes protected from ordinary trash
- Trash removes a custom page from public eligibility; restore returns to draft
- FR public only; localization extension is a separate planned contract
- No custom JavaScript, arbitrary React components or remote runtime execution

## Release acceptance
Run SANILA static source tests, Next.js type checks and build, full authenticated browser acceptance, create/edit/save/publish/rollback E2E tests against a test database, and verify the protected demo workflows before production deployment. Do not claim browser acceptance from source checks alone.
