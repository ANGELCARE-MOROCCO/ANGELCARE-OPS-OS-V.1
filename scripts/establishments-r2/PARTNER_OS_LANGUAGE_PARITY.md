# Partner OS: one experience in French, English and Arabic

## Implemented source

All three dedicated routes use the same `EstablishmentsExperience`, `PartnerHero`, `PartnerJourney`, native explorer and enquiry components. Language controls text, number formatting and reading direction. The six chapters, twenty capability families, sixty visible advantages, images, actions, native catalogue authorities and enquiry endpoint remain shared.

The existing header accepts an optional language-link slot. Only the Partner OS routes and the Partner OS state of the establishments entry provide it. Its existing appearance and CSS remain unchanged. Switching language preserves the dedicated Partner OS destination, query parameters, territory and module/chapter fragment. Other storefronts retain their default language links.

Module choices, situation, priority, site count, horizon, expanded explanations and presentation choices use language-independent session keys and stable identifiers. Admissions, planning, team, finance and reading controls retain their choices across language navigation. Persisted records are bounded and whitelist-decoded; contact details are not included.

Arabic uses the same layout with RTL reading order, logical overlay positions, reversed directional graphics and progress origin, and the same photographic sources. Contact identifiers use LTR; free-text fields use automatic direction. Native titles and reference identifiers are isolated where required, without translating a published offer name through the editorial dictionary. The offer-detail empty-description fallback is translated.

## Recovery provenance

The earlier workspace was removed during an interruption. Fifteen application source files from the unpublished Partner OS implementation were recovered through their recorded Git blob hashes; all fifteen hashes matched before applying this follow-up. The release baseline is `3c65f39b801be52dc6621b50badc84b50237d8c6`.

Two original photographic assets and the old browser evidence were not available from the uploaded Git objects or saved files. Their paths remain exactly as authored. They have not been replaced with different artwork or reconstructed from screenshots.

Required originals:

| File under `apps/marketplace-web/public/angelcare-marketplace/partner-os-r1/` | Dimensions | Git blob SHA |
| --- | --- | --- |
| `direction-scene.png` | 1536 × 1024 | `cf2b19be80661bd95832c63eb7f17298c7549606` |
| `finance-scene.png` | 1774 × 887 | `646e838f521a096cb6fa42161452d616f60c6ee7` |

`verify-partner-os-assets.cjs` deliberately blocks release until both exact originals are present. The language implementation is reviewable, but this recovered checkout is not a complete visual release package.

## Verification commands

From the repository root, using application dependencies:

```sh
node scripts/establishments-r2/verify-partner-os-i18n.cjs
NODE_PATH="$PWD/apps/marketplace-web/node_modules" node scripts/establishments-r2/verify-r5.cjs
NODE_PATH="$PWD/apps/marketplace-web/node_modules" node scripts/establishments-r2/verify.cjs
NODE_PATH="$PWD/apps/marketplace-web/node_modules" node scripts/establishments-r2/verify-r4.cjs
apps/marketplace-web/node_modules/.bin/tsc -p apps/marketplace-web/tsconfig.partner-os.json --pretty false
node scripts/establishments-r2/verify-partner-os-assets.cjs
git diff --check
```

The parity suite exercises the actual rendered components in FR/EN/AR, all descriptions and advantages, identical structures and image sources, native ten-card/empty states, canonical conversion paths, complete enquiry payloads, language destinations, state restoration, mixed-script fields and catalogue-name authority. Asset availability is a separate gate and is not counted as a passing source check.

Current restored-checkout results: **65 checks pass** (22 language parity, 17 R5 behaviour, 19 native contracts and 7 R4 extensions). The focused strict route/client TypeScript check and whitespace check pass. The approved-asset gate reports both scene PNGs missing and remains blocked.

Before the cleanup, browser checks verified EN → AR → FR continuity, retained territory and selected modules, twenty expanded explanations and studio choices. English and Arabic failure/retry checks retained contact inputs, submitted identical retry payloads, and confirmed only after receiving a reference. Those observations remain historical evidence; current post-recovery photographic visual review is blocked by the missing originals.

No SQL, production image build, remote publication or deployment is included. The earlier whole-application build ended with exit 137 and remains unverified.
