# AngelCare · 16 Specialist Destinations R1

Delivered implementation: 14 dedicated specialist landing pages plus Academy programme discovery and Academy request. French, English and Arabic, responsive layouts and RTL. Reuses the installed Marketplace shell. No production data changes, SQL, dependency installation, global TypeScript, full build or deployment.

## Destination matrix

| Existing route under /angelcare-marketplace/{locale}/ | Decision-maker and page logic | Existing enquiry authority |
| --- | --- | --- |
| establishments/creches | Directors; daily routines, team coordination and parent relationships | Establishments diagnostic |
| establishments/schools | School leadership; family relationships and extracurricular programmes | Establishments diagnostic |
| establishments/academy | Establishment managers; team skills and training priorities | Establishments diagnostic |
| establishments/partner-os | Operators; roles, information flow and deployment scope | Public Partner OS enquiry |
| hospitality/kids-club | Hotel operations; spaces, discovery activities and staffing context | Hospitality diagnostic |
| hospitality/guest-childcare | Hotel operations; guest request, stay context and childcare coordination | Hospitality diagnostic |
| hospitality/family-concierge | Guest experience leaders; family stay itinerary and coordination | Hospitality diagnostic |
| hospitality/seasonal-programs | Hospitality management; seasonal calendars and operating context | Hospitality diagnostic |
| health-partners/maternity | Maternity partnership leads; non-medical continuity into the home | Health Partners diagnostic |
| health-partners/mother-baby-care | Partnership leads; practical, non-medical parent support | Health Partners diagnostic |
| health-partners/workshops | Partnership leads; educational workshop contexts | Health Partners diagnostic |
| corporates/family-benefits | HR and employee experience leaders; employer family programmes | Corporates diagnostic |
| corporates/emergency-support | HR and operations; contingencies, scope and coordination | Corporates diagnostic |
| corporates/family-days | HR and communications; intergenerational event planning | Corporates diagnostic |
| academy/programs | Individual or organisational learners; goals, published programmes, learning decision guide | Canonical offer details or Academy request |
| academy/request | Individual, team or establishment training brief | Existing public Academy enquiry |

## Composition and interactions

The 14 specialist pages have different hero structures, module orders, specialist chapter content, decision diagrams and dedicated editorial photographs. Each contains 12 purposeful modules after its opening: educational narrative, specialist priorities, interactive project explorer, operating stages, real catalogue, scope explanation, decision questions, related destinations, FAQ, copyable brief, an existing enquiry form and a closing invitation. Module order varies per destination. Academy programmes uses its own goal and content explorers; Academy request is a dedicated form.

Interactive choices are preferences, not price quotations, availability commitments, diagnoses or confirmed bookings. The project brief can be copied, passed in the native request URL or explicitly appended to the form. Forms preserve inputs on failure, prevent duplicate submission while pending and report success only with a valid returned request reference. Academy handles timeouts and malformed success responses.

## Native catalogue association

Existing imports, schemas and category membership authorities remain unchanged. A specialist page reads existing published, visible native categories with the exact key `parent/child` or `parent-child`, plus active collections with the matching key and parent storefront scope. Secondary category memberships are supported. The published parent category can instead declare existing keys through its existing JSON experience configuration:

```json
{
  "specialist_associations": {
    "hospitality/kids-club": {
      "category_keys": ["EXISTING_NATIVE_KEY"],
      "collection_keys": ["EXISTING_PUBLISHED_COLLECTION_KEY"]
    }
  }
}
```

This is an optional configuration shape, not an instruction to create a new category or execute SQL. No taxonomy writes or heuristic title/schema assignment occur. If no matching association exists, the page stays useful and displays an honest empty catalogue. Academy reads the existing Academy native memberships/collections, then retains training and supported Academy schemas; future training schemas remain discoverable. No offer is reassigned by installation.

The repository pages category IDs and memberships and batches offer IDs. It reads canonical published offers for the configured MA-MASTER territory/global scope. Unavailable offers and unknown schemas remain visible. Sorting/filtering never mutate canonical objects. Actual prices and media are used; null media has an honest placeholder. Product/service images use contain. Catalogue read errors produce a retry state distinct from an empty catalogue.

## Protected boundaries and published content

An exact published Studio/CMS page on a nested route continues to take precedence. Such a page will remain visible rather than being forcibly replaced by this fallback implementation. Parent storefronts, homepage, Families, Home Services, installed seven business worlds, atomic detail components, customer auth, category/import engines, global navigation and footer are protected. The installer snapshots 308 protected files and verifies they remain unchanged.

Generated editorial scenes are illustrative, distinct per destination and never asserted to be AngelCare facilities, staff or customer evidence. They are not substituted for missing catalogue media. Health content maintains the non-medical scope.

## Verification and limits

- Strict scoped client/component TypeScript check passed: 9 root modules and 14 real source files. Server integration and repositories checked separately with adapters/fixtures.
- 77 scoped content/route/runtime checks passed.
- 16 existing backend handler success/failure checks passed with mocked database boundaries.
- 14 native repository checks passed, including 521 offer memberships, pagination/batching, locale completeness, secondary placement, explicit configuration and read failures.
- 8 installer/rollback checks passed, including automatic restoration after injected runtime failure.
- 111 browser checks passed across 48 desktop/mobile/localised page states, distinct compositions, catalogue operations, image fitting, enquiries and keyboard/reduced-motion behaviour.

The rendered references use named test catalogue fixtures and an isolated harness with Next/shell adapters. These checks do not prove production email delivery, live database assignments or a production Next image build. Remote Marketplace image build, immutable image reference and deployed route/enquiry checks remain release gates.

## Installation and rollback

Run the installer with the repository root. It verifies package hashes and exact existing route baselines before writing. New files must be absent or already identical; existing changes are preserved with a clear conflict report. It backs up exact affected files, writes atomically, runs the bundled runtime contract and checks protected boundaries and installed hashes. A failed verification restores its own writes. Reinstallation is idempotent. The printed rollback command restores the backup and refuses to overwrite later edits. The installer is a child Node process and does not close the interactive terminal.
