# Marketplace Admin performance acceptance

Classification: `STATICALLY_REVIEWED_RUNTIME_MEASUREMENT_PENDING`.

- Registry and control-room source paths use bounded repository queries, server-side filters or explicit limits rather than loading the entire Marketplace estate into one client component.
- Secondary detail is opened through dossiers, drawers and specialist routes; the 110-screen program does not mount every domain panel eagerly in one generic client shell.
- Search/filter state remains local where shared persistence does not exist. No fake shared preference service was introduced.
- App Router boundaries keep initial repository reads server-side. Mutation clients call existing thin API handlers and refresh their owned context.
- Static link reconciliation resolved 236 literal Admin links against current page files with zero broken destinations.
- No latency, concurrency or bundle benchmark is asserted without the deferred authenticated runtime.

Runtime follow-up: measure large registries, drawer lazy-loading, server waterfalls and public Marketplace regression once localhost/browser access is available.
