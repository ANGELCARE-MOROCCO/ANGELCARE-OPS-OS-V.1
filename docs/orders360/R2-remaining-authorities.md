# Orders 360 R2 — four remaining authorities

This continues the installed R1 implementation. The user confirmed nine master workspaces total and explicitly included all existing CRUD capabilities. Finance, Incidents & SAV, Documents and Contrôle are real in-place workspaces, replacing the four outbound navigation links. The first five areas and original admin shell remain.

## Exposed actions

| Area | Data and actions |
| --- | --- |
| Finance | Shared-filter payment portfolio; attempts; contextual manual payment creation; partial capture; failure/cancellation; refund; invoice creation from canonical lines; invoice notes/due date/lifecycle; invoice line register; receipt issuance; explicit-language PDF exports; refund history; reconciliation transitions and line decisions; settlement amount/eight evidence gates; invoice readiness evaluation |
| Incidents & SAV | Mission incident creation and native transitions; return/replacement creation, early-request edit/withdrawal and native lifecycle; eligibility/remedy decisions; dispute creation/investigation/decision; recovery plan creation/approval/execution/verification; linked operational exceptions and contextual handoff |
| Documents | Document metadata creation/edit, visibility, language, version, URL/checksum/expiration, publication, withdrawal and restoration; queued in-app notification creation/edit/delete; actual delivery history; existing Email OS and WhatsApp entry points; PDF generation history; global template creation/edit/archive/reactivation; 17 template kinds; all ten block types; drag/move/duplicate/remove/visibility/width/alignment/size/sections/signatories/spacing; FR/EN/AR variants and version restoration |
| Contrôle | Six closure prerequisites with concrete causes and immediate contextual correction actions; server re-read before native order completion; daily closure signature under native server scope; operating-case creation and metadata edit; named assignee choices; evidence submission/review; approval request/decision; exception and recovery controls; notes and canonical object relations with edit/delete; timeline, authorized audit, source health and effective permissions |

Financial cancellation, credit, request withdrawal and document withdrawal preserve their native histories. Final financial records are not presented as destructively deletable records. External delivery, bank payment, supplier purchase, carrier reservation and free provider capacity are never inferred from UI state.

## Engineering contracts

- Reads use complete pagination and batches, starting with tenant/territory-scoped canonical orders. Each linked collection is bound to those orders. Source failures remain explicit, rather than reporting a fabricated zero total.
- Mutations enter an authenticated same-origin order adapter. It verifies the parent order and linked payment, invoice, mission, fulfillment or operating case before delegating to native action authorities. New metadata actions use the existing tables, explicit permissions and audit.
- Document and case metadata writes detect stale revisions. Early request edits detect changed status/reason. Capture/refund retries retain the same idempotency key for an unchanged command. Non-idempotent actions lock retry after an unknown network/server outcome and direct the operator to read back the result.
- Invoice/receipt amount and payment ownership checks are retained. The native manual-payment authority remains dirham-only; its control is disabled for other order currencies. Existing foreign-currency records retain their currency and are never summed into another currency.
- Template versions requested by language are read completely and restored only for that language. Explicit-language PDF export fails if a compatible active template is unavailable, instead of silently switching language.
- Corrected the existing Enterprise Command relation table name to the canonical `angelcare_marketplace_object_relations` used by the native object authority and SQL schema.
- URL state includes area, section, filters and order selection. A gate can open the exact invoice, receipt, payment or communications section. Each register exposes filtering, paging, CSV and full record attributes.
- No SQL migration, dependency change, role expansion, live data mutation, push or deployment is included. Existing native database migrations/functions are prerequisites.

## Verification and release boundary

44 behavioral checks pass: 18 R1 checks plus 26 new authority checks. They exercise filter/URL continuity, currency grouping, receipt limits, server-derived customer/order identity, cross-order/tenant rejection, stale/concurrent document writes, permissions, queued-message rules, native delegation/idempotency and final-gate re-read. Focused TypeScript includes the actual dependency closure and synthetic fixture types.

Browser QA uses actual Next.js source components and the original admin shell with isolated synthetic data. Confirmed: nine-area navigation; financial creation/edit/read-back; receipt issuance; incident triage and return form; document edit/withdrawal/restore control; template block edit/save/read-back; approval decision/read-back; direct closure-gate navigation; explicit-language PDF download; no horizontal overflow at the tested desktop viewport. Four screenshots are included in the installer.

These checks do not certify the live database, actual payment provider, remote full production build or production deployment. The repository's supported Node 22 CI/GHCR build and authenticated target-database smoke checks remain release gates; local QA uses Node 24. The earlier full-repository TypeScript run exceeded the environment memory limit, while the focused check passes.

## Apply and rollback

The R2 installer is based on the exact installed R1 source commit `d920d02329e427978d7bc2be1e890bd2313168c5`. It checks every target against the literal Git blob baseline before mutation, verifies each payload hash, preserves unrelated work and writes a separate R2 rollback journal. Missing paths are represented as missing, including dynamic `[orderId]` routes. There is no force mode. After applying, run `npm run orders360:test` and `npm run orders360:typecheck` in `apps/marketplace-web` under the supported runtime, then use the existing release workflow.
