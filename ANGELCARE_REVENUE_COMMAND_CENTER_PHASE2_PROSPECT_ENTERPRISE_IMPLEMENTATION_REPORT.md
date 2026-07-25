# ANGELCARE Revenue Command Center
## Excellence v3 — Phase 2 Prospect, Account, Contact & Opportunity Enterprise Completion

**Delivery classification:** Governed incremental implementation under the signed 151/151 Immaculate Enterprise Completion Contract
**Repository baseline required:** Revenue Command Center Excellence v2 — Workspace Sovereignty
**Primary route family:** `/revenue-command-center/prospects`
**Delivery date:** 25 July 2026

---

## 1. Executive result

This package completes the first individually rebuilt commercial route family after the global Workspace Sovereignty foundation.

It replaces the former prospect mega-workspace across **21 routes** with purpose-built, full-width ANGELCARE enterprise experiences and introduces the controlled server, API, permission, schema-reconciliation and audit foundation required for prospects, accounts, contacts and opportunities.

This package does **not** claim completion of the entire 151-route contract. The cumulative route position after installation is:

- **151/151 route files preserved**;
- **21/151 routes individually rebuilt in this governed phase**;
- **142/151 routes receiving a direct or transitive premium experience across v1–v3**;
- remaining deep route families continue under the signed phased execution sequence.

No live database migration was executed from the delivery environment. Production cutover remains blocked until the supplied read-only preflight confirms the canonical UUID contract.

---

## 2. Individually rebuilt route estate — 21/21

### Portfolio and command routes — 15

1. `/revenue-command-center/prospects`
2. `/revenue-command-center/prospects/directory`
3. `/revenue-command-center/prospects/executive`
4. `/revenue-command-center/prospects/pipeline`
5. `/revenue-command-center/prospects/qualification`
6. `/revenue-command-center/prospects/decision-map`
7. `/revenue-command-center/prospects/appointments`
8. `/revenue-command-center/prospects/proposals`
9. `/revenue-command-center/prospects/negotiation`
10. `/revenue-command-center/prospects/recovery`
11. `/revenue-command-center/prospects/analytics`
12. `/revenue-command-center/prospects/performance`
13. `/revenue-command-center/prospects/high-value`
14. `/revenue-command-center/prospects/risk`
15. `/revenue-command-center/prospects/new`

### Enterprise dossier routes — 6

16. `/revenue-command-center/prospects/[id]`
17. `/revenue-command-center/prospects/[id]/qualification`
18. `/revenue-command-center/prospects/[id]/decision-map`
19. `/revenue-command-center/prospects/[id]/proposal`
20. `/revenue-command-center/prospects/[id]/negotiation`
21. `/revenue-command-center/prospects/[id]/recovery`

Every route now imports the new enterprise prospect system directly. The legacy `RevenueProspectsV12MegaWorkspace` is no longer the route-family renderer.

---

## 3. Frontend experience delivered

### 3.1 Full-width corporate composition

The route family inherits the Revenue Workspace Sovereignty shell and uses the full available operational canvas beside the global sidebar. It includes:

- premium white and icy-blue ANGELCARE enterprise surfaces;
- institutional navy, controlled ANGELCARE red and semantic operational colors;
- French corporate terminology;
- `fr-FR` formatting;
- visible commercial monetary values in **Dh**;
- responsive desktop, tablet and mobile transformations;
- real loading, refreshing, error, empty and schema-readiness states;
- no fabricated records, fake analytics or simulated successful actions.

### 3.2 Purpose-built route compositions

The 15 portfolio routes have distinct operating purposes rather than a repeated dashboard template:

- acquisition command;
- commercial directory;
- executive portfolio review;
- opportunity pipeline;
- qualification control;
- decision-maker mapping;
- appointment readiness;
- proposal readiness;
- negotiation exposure;
- recovery command;
- analytical cockpit;
- owner performance;
- high-value portfolio;
- risk command;
- complete dossier-creation studio.

The six dossier routes provide separate experiences for identity and operating history, qualification evidence, decision-map strategy, proposal readiness, negotiation context and recovery intervention.

### 3.3 Enterprise dossier depth

The dossier can surface, where the reconciled schema is available:

- prospect identity;
- linked account;
- primary and additional contacts;
- opportunities;
- tasks;
- appointments;
- activity timeline;
- qualification assessments;
- decision-map members;
- commercial risks;
- account plans;
- opportunity-stage history;
- opportunity participants;
- opportunity risks;
- competitors.

### 3.4 Premium modal system

The phase introduces dedicated transactional experiences for:

- creating an opportunity;
- assessing qualification;
- adding a decision-map member;
- declaring a commercial risk;
- editing a prospect dossier;
- creating or editing an account;
- creating or editing a contact;
- progressing an opportunity.

The modal foundation includes:

- focus trapping;
- focus restoration;
- Escape-key handling;
- background scroll protection;
- accessible dialog semantics;
- sticky action areas;
- mutation loading and error feedback;
- responsive transformation.

### 3.5 Honest capability boundaries

The proposal and negotiation routes prepare and expose the canonical account, contact, qualification, value, risk and opportunity context. They explicitly disclose that proposal versions, line items, pricing approvals, negotiation rounds, contract generation and payment gates belong to the subsequent dedicated phases. No fake send, signature, publication or payment action was introduced.

---

## 4. Server and API completion

### 4.1 New controlled APIs — 10

- `GET/POST/PATCH /api/revenue-command-center/accounts`
- `GET/POST/PATCH /api/revenue-command-center/contacts`
- `GET/POST/PATCH /api/revenue-command-center/opportunities`
- `POST /api/revenue-command-center/opportunities/transition`
- `GET /api/revenue-command-center/prospects/enterprise`
- `POST /api/revenue-command-center/prospects/enterprise/create`
- `GET/PATCH /api/revenue-command-center/prospects/[id]`
- `POST/DELETE /api/revenue-command-center/prospects/[id]/decision-map`
- `POST /api/revenue-command-center/prospects/[id]/qualification`
- `POST /api/revenue-command-center/prospects/[id]/risks`

The existing canonical prospect API was extended to preserve account and contact links.

### 4.2 Server-side access enforcement

Every new API resolves the ANGELCARE custom application session before using the service-role data client. Mutations require explicit Revenue capabilities rather than relying on hidden frontend controls.

The permission catalogue now defines the Revenue Command capability set for:

- prospects;
- qualification;
- decision maps;
- risks;
- accounts;
- contacts;
- opportunities;
- opportunity transitions;
- tasks;
- appointments;
- partnerships;
- B2C;
- analytics;
- activities.

Existing `revenue.view` and `revenue.manage` compatibility is preserved for current role templates while more precise assignment becomes available.

### 4.3 Audit and activity behavior

Mutations create business-facing Revenue activities and command audit events. Opportunity progression validates canonical stage names and requires reasons for:

- backward movement;
- `closed_won`;
- `closed_lost`.

Contact PATCH operations now preserve unspecified canonical fields. Optional relationship-insert failures are returned explicitly as `relationshipWarning` rather than being silently discarded.

### 4.4 Atomic new-dossier creation

The new dossier studio calls one controlled API, which invokes the database RPC:

`public.revenue_create_enterprise_prospect_dossier(...)`

The transaction creates the linked account, optional primary contact, prospect, optional opportunity, initial stage history, activity and audit record as one database unit. Fragmented client-side creation has been removed.

---

## 5. Additive schema completion

The migration adds missing enterprise columns to the canonical base records and creates **11 support tables**:

1. `revenue_account_aliases`
2. `revenue_contact_relationships`
3. `revenue_decision_map_members`
4. `revenue_qualification_assessments`
5. `revenue_account_status_history`
6. `revenue_account_risks`
7. `revenue_account_plans`
8. `revenue_opportunity_stage_history`
9. `revenue_opportunity_participants`
10. `revenue_opportunity_risks`
11. `revenue_opportunity_competitors`

It also creates:

- the canonical `revenue_prospect_enterprise_overview` read model;
- update-time triggers for the new support tables;
- auditable opportunity stage-change capture;
- indexes for portfolio, dossier and history access;
- the atomic enterprise dossier RPC.

The migration performs no table drop, truncation or business-data deletion.

### 5.1 Legacy task and appointment compatibility

Historical source files allow `entity_id` to be either `text` or `uuid`, and `due_date` to be either a date or timestamp. The migration preserves those legacy values and the canonical read model compares entity links through an explicit text representation rather than forcing a destructive type rewrite.

### 5.2 Direct-access security

The 11 new support tables enable RLS and are locked from direct `anon` and `authenticated` access. Their privileges, the enterprise view and the atomic RPC are restricted to the controlled `service_role` server path. The service-role client is used only after the custom ANGELCARE session and Revenue permission checks pass.

---

## 6. Mandatory live-schema reconciliation gate

The repository contains incompatible historical definitions:

- an older `revenue_prospects.id text` model;
- a later canonical `revenue_prospects.id uuid` model.

`CREATE TABLE IF NOT EXISTS` does not convert an existing text primary key. Therefore, migration execution based only on repository files would be unsafe.

Before applying the migration, run:

`supabase/revenue-command-center/preflight/20260725_prospect_enterprise_live_schema_preflight.sql`

Proceed only when the final `CUTOVER_GATE` reports `READY` and `public.revenue_prospects.id` is `uuid`.

When it reports `BLOCKED`, stop. A separate approved text-to-UUID data migration is required with mapping, backfill, foreign-key reconciliation, deep-link compatibility, validation and rollback evidence.

The migration itself repeats the UUID hard gate before making any change.

---

## 7. Rollback strategy

The supplied controlled rollback removes Phase 2-only:

- view;
- RPC;
- triggers;
- support tables.

It intentionally retains additive columns on canonical base tables to prevent loss of live values captured after cutover. The rollback must only run after backup and explicit approval.

---

## 8. Verification evidence

### Global Revenue Command acceptance

```text
99 checks passed. No contract violation detected by the static acceptance gate.
```

### Prospect enterprise Phase 2 acceptance

```text
258 checks passed. Prospect / Account / Opportunity Phase 2 is statically accepted.
```

The Phase 2 gate verifies:

- all 151 route files remain present;
- exactly 21 prospect routes are preserved and rebuilt;
- 15 distinct portfolio modes and six dossier experiences exist;
- no route uses the legacy prospect mega-workspace;
- full-width responsive styles and French/Dh presentation exist;
- modal focus and keyboard behavior exist;
- APIs enforce server-side access;
- mutations emit activity and audit behavior;
- permissions are registered;
- migration objects, indexes, triggers, view, RPC and RLS exist;
- direct browser-role access is revoked;
- the preflight is read-only;
- rollback is controlled;
- TypeScript isolated syntax passes;
- CSS-module references resolve.

### Verification boundary

The supplied source copy contains no installed `node_modules`, live environment variables or authenticated production runtime. Therefore:

- a full Next.js production build is not claimed;
- a full dependency-aware TypeScript project check is not claimed in this isolated package environment;
- live Supabase migration execution is not claimed;
- authenticated browser E2E testing is not claimed.

The focused project configuration is included for execution after dependencies are installed:

```bash
npx tsc -p tsconfig.revenue-command-center-prospect-phase2.json --pretty false
```

No `npm run build` was executed.

---

## 9. Exact completion boundary

### Completed in this package

- prospects, accounts, contacts and opportunities route-family frontend;
- 21 individual route contracts and compositions;
- enterprise portfolio and dossier reads;
- account, contact and opportunity APIs;
- qualification, decision-map and risk mutations;
- controlled opportunity transitions;
- atomic dossier creation;
- precise permissions;
- business activities and action audits;
- additive schema support;
- live-schema preflight and controlled rollback.

### Still governed by later signed phases

- tasks, approvals and dependency completion;
- meetings, participants, outcomes and full communication persistence;
- proposal versions, line items, pricing and approval engine;
- negotiation rounds, objections, counteroffers and concessions;
- contract, signature, obligation and renewal records;
- payment promises, finance handoff and activation gates;
- partnership full-cycle completion;
- B2C full-cycle completion;
- campaigns, provider events and revenue attribution;
- executive orchestration and final 151/151 individual-route acceptance.

---

## 10. Final Phase 2 acceptance statement

This package is a production-governed implementation block, not a visual prototype. It establishes a premium ANGELCARE prospect operating environment and the canonical account/contact/opportunity foundation required by all subsequent commercial phases.

It is safe to install at the repository level after Excellence v2. Database cutover remains intentionally conditional on the live UUID preflight, backup and policy review.
