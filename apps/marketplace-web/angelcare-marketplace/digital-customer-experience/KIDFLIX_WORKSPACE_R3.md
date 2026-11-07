# KidFlix Workspace R3 — implementation and acceptance record

Source baseline: `439ae71a959433706b13b4233e4c1b48af6d5d97` on `upgrade/next-angelcare-upgrade`.
Release date: 7 November 2026. This is a source implementation and guarded installer, not a production deployment certificate.

## The entry-point defect addressed

R2 exposed its new importer through CreationStudio. Existing inventory drafts and Dossier 360 still entered Workspace → Editor → DossierStudio, which retained the former vertical workflow. R3 changes those actual entry points. Workspace's create, existing-record and deep-link paths now use Editor. CSV correction editors also retain Editor and its recovery/reconciliation logic.

The canonical workspace has four horizontal areas: **Contenu, Organisation, Aperçu, Publication**. Existing bookmarks with old section names resolve within these areas. No new sidebar, tablet view or mobile preview selector is introduced. The global administration shell and protected public branding remain intact.

## Requirement / implementation / evidence

| Requirement | Implementation | Verification and limits |
|---|---|---|
| Existing draft and 360 use the upgrade | Workspace routes creation and existing drafts into Editor; rewritten DossierStudio wraps the retained native renderers | Browser suite starts at the actual Workspace inventory, opens a draft, then closes and reopens it |
| Simplified flow without another editor | One four-area navigation; embedded importer suppresses its separate three-step journey | Browser asserts the canonical navigation and absence of the nested journey |
| Preserve registered capabilities | Existing authoring, design, journey, access, outputs, team, references, history and recovery renderers remain accessible; searchable capability index remains | `CAPABILITY_INVENTORY_R3.json` records every family and registered control; representative controls are browser-tested, not every permutation |
| Category, subcategory, family grouping | Category selection on creation; subcategory, topic/parent, subject and verified catalogue classifications exposed in Organisation | Browser checks subtype, topic and classifications; existing catalogue identity is retained |
| HTML ZIP is a first-class source | Existing UniversalInteractiveImport integrated into the actual Editor; scoped matching, explicit target mismatch decision, bounded upload, server checkpoints, optional declared-cover promotion | Existing-dossier browser test transfers a large ZIP in three chunks and observes autosaved package + cover on the same record |
| Native formats remain supported | NativeSourceImport reuses signed media preflight/upload/completion, appendSource and applyCreationMedia; grouped files or one draft per file | Browser uploads an actual PNG into native cards; other native categories retain their existing schema and format contract |
| Minimum manual preparation | Validated declarations populate absent fields; HTML native-content minimums stay inactive; imports and HTML metadata save once idle | 16 families × 3 locales validated by delivery contract suite; no native card, sound or question content is fabricated |
| Declared ages vs reviewed ages | Source view displays the exact difference and offers an explicit action to use package ages | Existing reviewed values remain unless the admin chooses that action; age suitability is not inferred |
| Final blocker decoder | Gate groups diagnostics by actual control, shows cause, impact, evidence, current value and declared choices | Browser introduces cover/classification/continuity blockers and corrects them without leaving the gate |
| Cover repair at final gate | Choose an available native PNG, upload PNG, or promote a declared/selected PNG from the actual package | Browser tests both existing-media selection and package-PNG promotion |
| Scalar, classification and reference repair | Registered text, number, toggle, enum and multi-select controls; scoped topic, typed record, published-offer and eligible package choices | Service suite tests invalid values, stale plans, scope, permissions, media eligibility, retained originals and repeated requests |
| Complex native content | Registered collection editor can open inline in the final gate | Browser opens missing native-card collection controls inside Publication |
| Server-authoritative repair | Current record, actor permission, revision, content fingerprint, current diagnostic and selected reference rechecked; native save command records the revision | Tests use actual repair service and actual edition inspector with controlled repository/package authorities |
| Repair receipts and idempotency | Actor, request, timestamp, edition, before/after, previous revision and command hash retained privately; a repeated identical receipt returns its prior result | Service tests cover repeated request and changed-payload rejection. Recent embedded history is bounded; full record revisions remain governed by the installed native revision authority |
| Revalidation after repair | Inspect the saved edition again after every mutation | Neither a local patch nor an upload completion is treated as publication success |
| Review and one-action publication | Native independent-review policy remains authoritative; direct atomic edition publication appears only when the server reports that policy permits it and the publisher is active | Browser checks direct action, disabled publishing permission, and mandatory review policy; real distinct-user approval remains a production acceptance item |
| Public result differs from draft readiness | Public check panel appears when an active edition exists; upstream prerequisites produce “not checked” instead of fabricated downstream failure | Controlled public-status fixture exercises the publication UI. Real anonymous storefront/runtime acceptance is pending deployment |
| Recovery and concurrent edits | Existing Editor local/server recovery, stable receipts, revision reconciliation and version history retained; native source transfer checkpoints retain exact save payload/request for retry | Existing import-service/PGlite tests cover interruption, leases, retries, crash recovery and cancellation. Real concurrent production operators still need acceptance |
| Bulk corrections | Category inventory exposes scoped draft scanner; groups root causes, reviews before/after, applies selected records with per-record results and retained session receipts | This is bounded operational feedback, not a new lifetime analytics warehouse |
| Source integrity and rollback | Installer checks origin, branch, every before/after SHA, payload checksums and symlinks; preserves unrelated work; journals backups and verifies every applied file | Installer test covers conflict refusal, idempotent application, preservation and guarded rollback |

## Repair authority

`publication_gate` reads the saved edition and builds declared controls. `publication_options` resolves candidates under the current actor and scope. `publication_repair` accepts only a current diagnostic, rejects an obsolete fingerprint/revision, validates the value or reference, saves through the native command authority, and runs edition inspection again.

Package choices are searchable and paginated. A package already bound to another dossier is not an eligible repair choice. Import-source mismatch displays actual versus declared identity and exposes the matching dossier or a reviewed mapping where allowed; the importer retains its independent-copy action.

All original native data remains stored when HTML delivery is selected. Publication projection excludes its inactive native collections and tools. Switching back to native delivery restores that content's native requirements. Registered format controls remain explicit.

Private repair originals do not enter public manifests. Publication, media rights, translation approval and meaningful source content are never invented to eliminate a blocker. If a diagnostic has no safe declared mutation, its targeted editor remains available; privileged infrastructure activation stays a release operation rather than an admin “fix” button that cannot actually work.

## Verification results

- Delivery contracts: **64 checks passed**, including 16 families × FR/EN/AR.
- Publication repair service: **19 checks passed** using the actual service and edition inspector; repository, media and package authorities are controlled fixtures.
- Existing-draft browser journey: **17 scenarios passed**, using actual Workspace, Registry, Editor, DossierStudio and PublicationGate components with controlled APIs.
- Previous CreationStudio regression browser suite: **9 scenarios passed**.
- Existing PostgreSQL/PGlite migration and atomic binding suite: **13 checks passed**.
- Existing recoverable import-session suite: **13 checks passed**.
- Targeted strict TypeScript graph: passed with external Next/Supabase/repository boundary declarations. **This is not the full production application's typecheck or build.**
- Desktop screenshot review: source workspace, introduced blockers, and publication screen inspected. Screenshots contain labelled test content, not customer or production data.

The reproducible contract and browser suites are included in `scripts/kidflix-delivery-r2`. CI now runs the new service and actual-entry browser suites alongside the preceding suites. To reproduce: run `npm ci --ignore-scripts --no-audit --no-fund`, `npm run verify`, then `npm run browser` in that test directory. CI uses Node 22 and an installed Chrome/Playwright browser. No local production Next build was run.

## Database and activation

**No new R3 SQL migration is introduced.** R3 reuses the installed record, revision, media, import-session and atomic edition authorities. The delivery package includes one copy of the existing idempotent R2 activation SQL for installations where it has not yet been activated. The installer does not execute it. Running the installer cannot activate SQL or change a production environment.

## Remaining release acceptance — not claimed complete

1. Apply the guarded installer to the user's checkout; verify exact source hashes.
2. If the existing R2 database contract is absent, activate its supplied migration through the normal privileged release channel.
3. Run the repository's complete remote TypeScript, lint, CSS and image-build workflow against the resulting source commit; inspect its actual result.
4. Deploy the built image through the established Coolify process.
5. With the real admin session and storage configuration: import/resume, save/reopen, exercise independent review with different authorized users, and publish an edition.
6. Verify the real anonymous category storefront, card cover, detail page, HTML runtime, language editions and any enabled downloads; then test an edition update and recovery against real data.

No GitHub push, production SQL execution, image build, Coolify deployment or live anonymous publication is claimed by this implementation record. The installer and included tests make the result concrete and reviewable; a controlled-fixture test cannot substitute for those live acceptance steps.
