# SEO POWER regression harness

From apps/marketplace-web, install the normal app dependencies, then `npm ci --prefix scripts/seo-power-tests` and `npm test --prefix scripts/seo-power-tests`.

Runs real migration transactions in PGlite, native handlers/repository/public metadata through fixture authentication and a PGlite transport, real Crawlee HTML extraction through a fixture HTTP client, and actual Linkinator status checks on loopback. Does not connect to production Supabase or submit to IndexNow. Fixture TypeScript is retained as `.ts.txt` and loaded by the isolated test bundler, outside the production TypeScript build. Reports are generated locally. Live Supabase extensions, HTTPS transport and GitHub OIDC signature intake require installation checks.
