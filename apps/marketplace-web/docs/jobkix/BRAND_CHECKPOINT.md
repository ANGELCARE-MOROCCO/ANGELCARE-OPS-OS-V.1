The three user-designated originals were located in Downloads, opened and preserved unchanged under `docs/jobkix/references/brand/`. Exact source paths, dimensions, bytes, hashes and rights provenance are in `brand-register.json` and `reference-registry.json`.

| Original | Application |
|---|---|
| `logo jobkix.png` | Transparent color derivative in the JOBKIX header and compact Marketplace entry |
| `logo jobkix reverted white.png` | Transparent reversed derivative on the dark JOBKIX footer |
| `favicon browser.png` | Proportionally resized 16/32/48 browser icons and 180/192/512 application exports |

The user explicitly approved deterministic pixel-based background removal after two image-tool attempts were rejected for visible artifacts. The rejected outputs are not application assets. `prepare-brand.cjs` samples the original background, retains opaque foreground pixels unchanged, solves antialiased edge transparency and crops transparent margins. It does not redraw, recolor, mirror or reshape the supplied identity. Violet/coral accents and the entire GLOBAL CAREERS PLATFORM tagline are retained.

Both final logo assets were individually inspected against the originals. `evidence/brand-color-on-white.png` and `evidence/brand-white-on-dark.png` are flattened asset-inspection views, not rendered website screenshots. The installed logos retain actual alpha transparency.

The native root metadata returns the existing web-presence authority for every non-JOBKIX request. Its JOBKIX branch and the localized JOBKIX layout use `jobkixIcons()`. No global favicon, global manifest or other world's icons are changed, and no client script mutates document-head links. Installed Next metadata also retains the root file-based favicon; the explicit JOBKIX PNG descriptors include matching small sizes. The actual 16-check local navigation suite now verifies seven language changes, six Arabic homepage widths, the Arabic Marketplace physical-right shortcut, and restoration of the original native icon descriptors/document attributes after entry and back. Browser-chrome icon painting and comprehensive world-by-world regression remain separate.

`MarketplaceBrandPair` keeps KidFlix then JOBKIX in a physical LTR pair, including within Arabic Marketplace navigation. The shortcut always targets `/jobkix/en`. Its link has an accessible brand name, a minimum 44px height, visible keyboard focus, and a compact complete logo. The existing horizontal scroll rail and twelve-storefront registry are retained. The shared-shell diff is limited to the import and two existing KidFlix placements. No native administration redesign is included.

Executed evidence: `node --test scripts/jobkix/brand.test.cjs` checks source/derivative hashes, actual transparency, exact interior source pixels, proportional icon exports, native metadata descriptors, protected source bytes and actual server-rendered link markup. CSS checks parse both owned modules. Server-rendered markup tests use the real React/Next Link components with a CSS-module name adapter; they do not establish browser layout, focus, mobile reflow or favicon behavior.

Status: brand originals RESOLVED; deterministic asset extraction INSPECTED; source integration and named native navigation checks PARTIAL_BROWSER_VERIFIED. Full product visual acceptance remains VISUAL_PENDING. Source acceptance does not imply release approval.
