# ANGELCARE Homepage World 02 — Saturated Visual Rebuild · 9 October 2026

This package replaces the previously delivered, unapplied pale homepage package. It rebuilds World 02's visual direction around the supplied live homepage reference: fuchsia, navy, colourful merchandising, compact offer shelves and real catalogue artwork. It preserves the existing World 02 component type, world ID and persisted revision; World 01 and Studio publication precedence are unchanged. It does not assign or publish a Studio world automatically.

## What ships

24 experiences: fuchsia campaign or evergreen ribbon; compact manual/pausable cinematic chapters with original-artwork offer shortcuts; immediate colourful need actions; twelve canonical storefront entrances; interactive discovery; family mosaic; service showcase; explicit service rhythms; configured learning goals; kit theatre and actual declared components; full-image product gallery; configured ages; editorial selections; independent service/product discoveries; native category directory; canonical collections; comparison; Academy; professional sectors; saved/recent browsing; human guidance; real trust information; FAQ; closing scene. Pink, sky-blue, violet and gold compositions alternate with navy editorial panels. Desktop discovery shelves fit six offers. Header search and navigation receive the permanent AngelCare accent treatment. Scroll updates the active section link; slideshow progress and ribbon highlights pause with hero motion settings.

Discovery has query, need, rhythm, age, goal, native category, availability and sorting controls, reset, honest empty states and progressive loading through every matching canonical item. Detail, booking, basket, enrollment, quotation and subscription links reuse the existing journey resolver. Unavailable or unqualified offers open their detail page. Product, service, kit and course photos use `object-fit: contain`, without zoom, stretch or overlays over the asset. Editorial photographs use cover and remain distinct from offer imagery.

The shared shell uses the supplied transparent colour wordmark in both header variants and its transparent pure-white version in the footer. Header, horizontal twelve-storefront navigation and homepage section navigation use coordinated sticky offsets. The footer remains the shared source-owned footer, without covering content.

Offer images delivered through the existing native media endpoint request the original by removing only its `variant` parameter. The validated native handler ignores the filename parameter and delivers the original media ID when no variant is present. External URLs remain unchanged. Canonical URLs and backend media records are not mutated; already-cropped external assets cannot be reconstructed by CSS. Original-image delivery and loading cost must be confirmed on the deployed application.

FR, EN and AR copy and RTL layouts are included. All meaningful controls work with native buttons, links, selects and disclosures. Hero autoplay pauses for reduced motion, focus, hover, hidden documents and offscreen visibility. Essential content starts visible; observer failure cannot hide it. Saved and comparison state use the existing engagement endpoint and change only after a successful response. Recent history is scoped by locale/territory, bounded to twelve canonical IDs, clearable, and usable without browser storage.

## Boundaries

The product gallery, age shelf and development showcase alternate offers from their already-declared atomic schemas so one format does not monopolize the initial preview. This is display ordering within the eligible canonical pool: no item, category assignment, import, price or atomic configuration is rewritten. Discovery results retain the user's selected sort order.

No SQL, atomic importer, eligibility engine, category import, canonical repository, global TypeScript, application dependency installation, full app build, commit, push or deployment is part of installation. Published CMS campaigns, selections, collections, cohorts and trust evidence are used when supplied; no scarcity, ratings, fake bundles, booking slots or publication promises are manufactured. The homepage category payload has no parent field: this implementation shows native category entrances and leaves the actual hierarchy to their canonical category pages.

## Verification and limits

See `CERTIFICATION.json` and the included verification reports for measured results. Scoped TypeScript verifies the new homepage modules and their local dependencies with narrow Next Link/Image and Puck interface declarations. Browser checks render the actual homepage, header, navigation and footer with local snapshot data and synthetic edge-case fixtures. Screenshots use the catalogue snapshot without synthetic QA offers, plus 60/60 exact original offer images cached read-only from their production media IDs; no repeated family-photo substitutions are used for those offers. The media cache is verification-only and is not shipped into production offer data or the install payload. Next Link/Image have lightweight preview adapters and engagement API calls are mocked. Browser checks do not certify current database content, deployed API behavior or production routes.

The installer validates all guards and destination baselines before writing, creates a journalled backup, checks installed hashes and runs the included dependency-free compiled runtime checks. New editorial photographs are installed only if missing; existing media is preserved. Reapplying is idempotent. Rollback refuses to overwrite later edits. Full Marketplace image build, immutable GHCR SHA/digest and deployed storefront checks remain mandatory release gates.

## Install

Unzip this folder into Downloads, then run:

```bash
node "$HOME/Downloads/ANGELCARE_HOMEPAGE_SATURATED_20261009/install.mjs" "$HOME/Desktop/angelcare-platform"
```

The installer prints the exact backup path and rollback command. If compatibility fails, it stops before any writes. Share the reported path rather than resetting or cleaning the repository. This package cannot establish the HEAD of a Mac checkout that was not accessible in the preparation environment.

## Release checklist

- Review installed changes with `git diff --stat` and `git diff --check`.
- Stage only reviewed homepage/shell/media/script/documentation files, avoiding patch backups and temporary configs.
- Commit and push the intended source branch using normal Git operations.
- Inspect the actual current Marketplace workflow trigger/input contract. Do not assume `main`, dispatch availability, or a pinned target SHA.
- Run **Build Marketplace GHCR One-Off** against the exact committed source and track its jobs live.
- Verify source constitution, compiled routes, runtime identity and image push success.
- Read the emitted image SHA tag and registry digest from the completed run; do not infer the built source from a workflow run's `headSha` when checkout accepts a different SHA.
- Deploy the immutable GHCR image in Coolify and verify home, Families, Home Services, Development, Kits, locales, images, saved/compare and canonical journeys on the deployed application.
