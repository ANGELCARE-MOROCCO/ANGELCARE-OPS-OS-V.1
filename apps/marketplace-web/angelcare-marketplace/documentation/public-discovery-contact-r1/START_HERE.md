# AngelCare — Public Discovery & Contact R1

## What is delivered

1. **Automatic, read-only connection-country indicator.** The same area of the shared public header now shows the IP-derived flag and localised country name. No dropdown, button, country list or location selector exists. Unknown connections show a globe and “International”. The indicator does not change territory, coverage, price, currency, language or inventory.
2. **Marketplace discovery gateway.** `/angelcare-marketplace/fr/marketplace` (also EN/AR) uses the full installed header/footer. Twelve distinct editorial doors, need/audience guidance, search, native categories and native child-category links lead into the established storefronts. The gateway has no product grid, price panels or buy buttons. Published leaf categories lead to their own paginated offer discovery; actual offer details and all specialised storefronts remain the native destinations.
3. **Contact centre.** `/angelcare-marketplace/fr/contact` (also EN/AR) gains the complete shared shell, editorial opening, existing Hotline voice and direct-chat entry, twelve contextual subjects, adaptive request fields, relevant published team contacts, FAQs and customer-area continuity. Requests use the existing public inquiry authority and appear in `/angelcare-marketplace/admin/public-inquiries`. The receipt is a recorded request, not a booking, payment, availability promise or inbox-delivery assertion.

## Apply the code

```bash
unzip -q -o "$HOME/Downloads/ANGELCARE_PUBLIC_DISCOVERY_CONTACT_R1_20261015.zip" -d "$HOME/Downloads" &&
node "$HOME/Downloads/ANGELCARE_PUBLIC_DISCOVERY_CONTACT_R1_20261015/install.mjs" "$HOME/Desktop/angelcare-platform"
```

The installer preflights every target before writing, backs up actual working files, merges only recognised non-overlapping source fragments, verifies installed hashes and prints a guarded rollback command. Unknown overlapping changes stop the entire install and remain untouched. Repeat installation is safe. Errors set the child Node process status; they do not call `exit` in your Terminal shell.

Optional read-only preflight: add `--check` after the repository path.

## One separate SQL activation

This only adds a unique partial index to the **existing** `public.angelcare_marketplace_public_inquiries.source_metadata`. It protects the new Contact submission key against duplicate inserts when a customer retries. It creates no table, service, worker, account or new receiving engine. Existing inquiry rows are not modified. Forms outside `entry=contact-centre-r1` remain outside the index.

Copy the first file, paste it into your Marketplace Supabase SQL editor, and run it:

```bash
pbcopy < "$HOME/Downloads/ANGELCARE_PUBLIC_DISCOVERY_CONTACT_R1_20261015/database/01_CONTACT_SUBMISSION_GUARD.sql"
```

Then run `database/02_VERIFY_CONTACT_SUBMISSION_GUARD.sql` in the same editor. Its result must show the unique index on the intended native table. The installer never executes SQL. Apply this index before deploying the new form. The code alone cannot guarantee deduplication across simultaneous server processes without that database index.

## Release

No new dependency, Coolify variable, worker or infrastructure resource is required. Commit/push through your normal SOP, run the existing remote **Build Marketplace GHCR One-Off** workflow for the exact source commit, and deploy the resulting immutable Marketplace image in the existing Coolify resource. This installer does not stage, commit, push, build or deploy.

## Acceptance on your deployed site

- Header: real connection country appears without any location control. Confirm on two connections with different public countries if available. IP geolocation is approximate; VPNs/mobile routing can show their egress country.
- Gateway: all twelve native worlds open their established destinations; real categories are visible; a leaf category opens its actual published offers with pagination.
- Contact: test a family request and an organisational request; verify the displayed receipt in the existing admin public-inquiries reception. A failed request must retain inputs. A retry of unchanged data uses the same submission key.
- Hotline: voice opens the existing reception; chat opens the existing text conversation view. This patch does not alter call dispatch, agent eligibility, queues, voice-room establishment or worker policies.
- Check FR, EN and Arabic RTL on desktop/mobile. Product detail images in the added category listing are contained rather than cropped.
- Existing custom published Studio contact compositions retain priority. The native Contact fallback is upgraded; custom assignments are not erased.

## Country detection and maintenance

The endpoint uses a bundled October 2026 DB-IP Lite IPv4/IPv6 database and local flag SVGs. A request does not call a third-party geolocation service. Only a two-letter country code is returned; the visitor IP is not returned or stored by this feature. Country responses are `private, no-store`. The browser reuses its result for fifteen minutes; only the displayed flag is requested, not all flags.

The existing reverse proxy must overwrite/sanitise client IP headers. The endpoint reads `X-Real-IP`, then the first `X-Forwarded-For` address; private/reserved addresses are ignored. It does not trust a browser-supplied country code. This integration must be checked against the deployed proxy. It is a cosmetic country hint, never an authority for authentication or service eligibility. No production proxy configuration has been changed here.

The bundled database does not update itself. Refresh monthly in **source**, then release through the same image process:

```bash
node "$HOME/Desktop/angelcare-platform/apps/marketplace-web/scripts/public-discovery-contact/refresh-country-data.mjs" --repo "$HOME/Desktop/angelcare-platform"
```

This optional maintenance command downloads the current DB-IP Lite release, checks its ranges, backs up the three current data files and updates only those source files. It starts no process or scheduler. Failed downloads leave the existing database in place. Country flags are from flag-icons 7.5.0 (MIT); geographic data is DB-IP Lite (CC BY 4.0). The discreet visible DB-IP attribution link is required by its licence.

## Preservation and rollback

The package has no changes to Homepage, Footer Studio, the four atomic detail templates, Product360/import engines, DCE, customer authentication/email, pricing or transaction authorities. Shared-shell edits are targeted to country rendering and the already approved header wording. Hotline receives only its existing open-window event adapter; the operational module is not replaced wholesale on a different source version.

The available recovered source baseline is the supplied 12 October archive plus the recorded Footer/Header work, not a newly inspected full 15 October repository. The installer guards current working edits rather than assuming that baseline is the current repository. If it reports an overlap, send the complete `PRESERVED_CONFLICT` list; do not force-copy the payload.

Run the exact rollback command printed during installation to restore the actual pre-install files. Later edits block rollback before restoration. The optional SQL index may remain after code rollback; it only affects records using this patch's specific entry/key. It does not need to be dropped to restore the previous UI.

## Code previews and evidence

`preview/Discovery.html` and `preview/Contact.html` are offline, self-contained previews rendered by the delivered React components and shared shell, with the actual Footer R2 renderer. They use clearly labelled fixture categories, contacts, France country response and a simulated receipt. They do not contact production or send requests. Production content, published custom shell/footer settings and inventory will come from your own native data.

`VERIFICATION.md` records exactly what was checked and the remaining deployment acceptance boundaries.
