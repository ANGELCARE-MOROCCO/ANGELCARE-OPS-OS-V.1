# Customer Experience Premium R1

## Implemented scope

The fresh supplied source archive is the compatibility baseline. This patch upgrades transaction and customer workspaces while retaining existing category-native, payment, wallet, authentication, catalogue and canonical handover authorities.

| Surface | Customer experience |
|---|---|
| Basket and quotation basket | Complete image fitting, separate configurations, working quantities, pending mutations, retry and distinct empty/error states |
| Atomic configuration | Four contextual openings; published offer information separated from customer inputs; actual published choices; contact and fresh validation requirements |
| Checkout | Contact/delivery, price and availability review, explicit agreements, payment, final review and recorded result |
| Payment | Native eligible methods and split contribution; pending/error states; native financial authority remains final |
| Result/recovery | Server references, accurate pending handover wording and owned session recovery; contact data retained on errors |
| Account | Purposeful navigation, actions, portfolio, document/payment/notification filters, favourites, support, settings and wallet presentation |
| Family | Contextual navigation and dashboard, private child profiles and existing native request/support forms with upgraded styling |
| Journey continuity | Native timeline presentation; ownership-checked recorded configuration with public fields rather than raw internal JSON |

## Boundaries

- Atomic schemas/import engines, category registry and Studio detail-page selection priorities are retained.
- Homepage, Families and Home Services storefronts are outside the payload.
- Shared shell retains logos and existing navigation; the basket icon now targets the transactional basket. Route wrappers reuse the shell without nested main elements.
- Existing customer authentication, email operations, wallet transactions and payment providers are reused, not replaced.
- Missing images have an honest text state. Image sources come from published offers. Verification-only catalogue fixtures and photography are excluded from installed code.
- Customer choices have meaningful validation and error states. Offer policy/capacity fields are no longer exposed as customer controls; no importer/schema authority is rewritten.
- Browser query payment states do not authorize settlement. Existing server financial checks remain required.
- Server confirmation checks price expiry, basket configuration/quantity signature, availability and live owned capacity holds before canonical handover. Previously recorded outcomes replay idempotently.

## Verification and practical limits

Scoped TypeScript checks target the customer components and their local dependencies with isolated Next/CSS adapters; they are not a full application compilation. The dependency-free runtime gate includes 31-schema world classification coverage and commerce field/selection contracts, not exhaustive populated-offer tests for every schema.

Actual conversion repository functions are exercised against an in-memory database adapter. Rendered browser checks use the actual components and existing shell with clearly labelled catalogue/API fixtures in French, English and Arabic, desktop and mobile RTL. The native Family forms retain existing field labels; this patch does not translate the entire Family backend.

No SQL, production customer account, live payment or live email operation is performed by verification or installation. A remote Marketplace image build and deployed customer journey checks are still required before asserting live readiness.

## Installation and recovery

The installer verifies payload hashes and accepts only each source file's supplied baseline or already-installed hash. Unexpected edits stop installation before writes. A backup records the exact prior state. Runtime or integrity failure restores applied files. Rollback refuses to overwrite edits made after installation. Repeat installation is safe.
