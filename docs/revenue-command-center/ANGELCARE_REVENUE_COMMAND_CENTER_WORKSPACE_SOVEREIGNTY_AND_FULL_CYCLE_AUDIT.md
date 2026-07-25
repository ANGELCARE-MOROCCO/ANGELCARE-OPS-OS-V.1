# ANGELCARE Revenue Command Center
## Workspace Sovereignty & Full-Cycle Architecture Audit

**Audit date:** 24 July 2026
**Source baseline:** ANGELCARE full source 2026-07-22 plus Revenue Command Center Excellence v1
**New execution stream:** Excellence v2 — full-width workspace sovereignty, uniform collapsible/extractable navigation, route-specific frontend depth, modal governance, and full-cycle backend gap detection.

---

## 1. Executive finding

The v1 cockpit improved visual clarity, but the current production screenshot confirms that the Revenue Command Center is still constrained by a centered desktop canvas. The available viewport is not being used as an operational surface. The module also contains multiple competing sidebar implementations, route families sharing broad templates, and modal systems with inconsistent dimensions and interaction rules.

The correct next step is not another isolated dashboard reskin. It is a system-level frontend sovereignty layer followed by route-family rebuilds and a schema/API completion audit.

---

## 2. Verified implementation footprint

- **151 protected frontend routes**
- **57 Revenue Command Center API routes**
- **43 dedicated Revenue Command Center TSX component files** in the source estate
- **19 modal/dialog-bearing implementation files**
- **33 Supabase tables/views directly referenced by the current Revenue Command Center API/lib/component layer**
- **334 revenue/revenue_os/bd table definitions** found across the supplied migration corpus

### Largest route families

| Route family | Routes |
|---|---:|
| B2C workflow | 26 |
| Appointments | 24 |
| Partnerships | 24 |
| Prospects | 21 |
| Daily tasks | 11 |
| Campaigns | 7 |
| Tasks | 6 |
| Remaining executive/intelligence routes | 32 |

### Shared presentation engines currently carrying large route estates

| Shared engine | Route wrappers |
|---|---:|
| `RevenueB2CWorkflowV12MegaWorkspace` | 26 |
| `RevenueAppointmentsV12MegaWorkspace` | 23 |
| `RevenueProspectsV12MegaWorkspace` | 18 |
| `RevenueDailyTasksV13McKinseyWorkspace` | 16 |
| `RevenuePartnershipsEnterpriseWorkspace` | 13 |
| `RevenuePartnershipsV13ActionsWorkspace` | 9 |

This confirms that a large route count does not yet equal 151 individually designed experiences. Each shared engine must become mode-aware and route-purpose-aware rather than presenting repeated structures with changed headings.

---

## 3. Visual and structural defects confirmed

### 3.1 Centered-canvas restriction

The v1 command dashboard used a content ceiling of `1680px`; the canonical transition workspace used `1600px`; other workspaces still carried limits such as `1780px` and `1920px`. On large corporate displays this creates major unused space, reduces operational density, and makes the system feel like a website placed inside the app rather than a command operating environment.

### 3.2 Competing sidebar systems

The source contains several navigation/sidebar implementations:

- Central dashboard embedded sidebar
- Shared `RevenueCommandCenterSidebar`
- Appointment-specific sidebars
- Prospect directory/acquisition sidebars
- Partnership workspaces with separate fixed/sticky sidebars
- Contextual dossier rails that visually resemble primary navigation

This creates inconsistent widths, active states, mobile behavior, spacing, themes and route coverage. The global primary navigation must be singular and uniform. Contextual side panels may remain only when they are clearly dossier intelligence panels rather than duplicate module navigation.

### 3.3 Modal inconsistency

Modal implementations range from narrow drawers to near-full-screen workspaces up to approximately `1900px`. Some use fixed viewport overlays, others right drawers, and others use full-page dark canvases. There is no consistent rule for:

- Quick action vs. complex workflow
- Drawer vs. centered modal vs. full-page studio
- Header and footer actions
- Focus trapping
- keyboard escape behavior
- responsive transformation
- dirty-state confirmation
- destructive confirmation
- evidence and audit presentation

### 3.4 Mixed visual generations

The route estate includes:

- Premium light enterprise surfaces
- legacy dark command pages
- violet/neon partnership experiences
- generic canonical transition pages
- source-of-truth workspaces with different UI vocabulary
- dense mega workspaces with different spacing and typography

The result is one backend ecosystem presented as several unrelated products.

---

## 4. Excellence v2 shell delivered in the current patch

The current incremental patch establishes the first mandatory layer:

- Full-width global Revenue Command shell
- Uniform primary sidebar across the protected route estate
- Desktop expanded mode
- Desktop compact icon-rail mode
- Extractable mobile/tablet overlay mode
- Persistent collapse preference using a new frontend-only key
- Route-aware active state
- Searchable navigation
- Expandable navigation families
- Premium ANGELCARE visual treatment
- Full-width removal for the command dashboard and major shared workspaces
- Removal of the duplicate partnership primary sidebar
- Existing `revenue.view` access gate, recovery bridge and enterprise operations bridge preserved

No API, database, migration, authentication, permission, worker, webhook or Revenue OS engine file is modified by this patch.

---

## 5. Full-cycle workflow gaps: schema/API reality

The migration corpus is broad, but the Revenue Command Center UI/API layer does not expose many of those capabilities as safe, dedicated business workflows. The audit must therefore distinguish three cases:

1. **Existing table and existing UI-safe API** — preserve and improve presentation.
2. **Existing table but no dedicated Revenue Command Center API/workflow** — build an additive bridge; do not duplicate the table.
3. **No dedicated table found in the migration corpus** — design a schema only after a live database preflight.

### 5.1 Critical API gap already detected

A current production component calls:

`/api/revenue/tasks/update-status`

No matching route exists in the supplied source. This is a confirmed broken or obsolete API reference and must be reconciled with the canonical task command API rather than silently adding a duplicate endpoint.

### 5.2 Accounts, contacts and opportunities

Tables found:

- `revenue_accounts`
- `revenue_contacts`
- `revenue_opportunities`
- `revenue_pipeline_history`

Current issue:

The Revenue Command Center API estate has no dedicated account, contact or opportunity CRUD route family. Much of the UI works through prospects, generic records or embedded metadata. The full cycle requires canonical APIs and relationship rules for:

- Organization/account identity
- Multiple contacts per account
- Contact roles and influence
- Opportunity value, probability and stage
- Account-to-opportunity relationships
- Opportunity-to-proposal and opportunity-to-contract relationships
- Pipeline history and stage transition evidence

### 5.3 Proposals, quotations and commercial versions

Found in migration corpus:

- Offer and pricing tables under `revenue_os_*`
- `revenue_os_proposal_propagations`
- no dedicated operational `revenue_proposals` or `revenue_quotes` table found

Required full-cycle capability:

- Proposal header and opportunity relation
- Proposal versions
- Line items and service bundles
- Pricing snapshots
- Validity period
- Approval state
- Recipient and decision-maker relation
- Delivery/open/view/response events
- Accepted/rejected/expired status
- PDF/document relation
- Negotiation revision chain

The design must reuse Revenue OS offer/pricing truth where appropriate and avoid duplicating price-book logic.

### 5.4 Negotiation and concessions

Found:

- `revenue_os_objection_patterns`
- `revenue_os_discount_rules`
- `revenue_os_margin_rules`
- no dedicated negotiation-session or concession-ledger table found

Required:

- Negotiation session
- Objection records
- Concession requests
- Margin-impact calculation reference
- Approval chain
- Counteroffer versions
- Decision deadline
- Final outcome and rationale

### 5.5 Contracts and agreements

No dedicated operational revenue contract/agreement table was found in the migration corpus. The existing `revenue_os_command_context_contracts` serves a command-context purpose and is not a commercial contract register.

Required:

- Contract/agreement record
- Proposal/version source
- Counterparty
- Signature state
- Effective and expiry dates
- Renewal date
- Contract value
- Payment terms
- Obligations and deliverables
- Document version relation
- Approval and signature evidence
- Activation gate

### 5.6 Payment commitments and revenue realization

Found:

- `revenue_os_payment_propagations`
- no dedicated payment-promise, invoice or commercial collection table found inside the Revenue Command migration estate

The Revenue Command Center needs an integration-safe commercial layer for:

- Payment commitment
- Expected amount and date
- Payment proof/reference
- Broken promise
- Collection follow-up
- Revenue-at-risk state
- Finance-module handoff
- Contract/payment activation gate

This should bridge to the authoritative finance/billing module, not become a duplicate accounting system.

### 5.7 Meetings and outcomes

Found:

- `revenue_appointments`
- appointment command views
- `revenue_os_meeting_propagations`
- no dedicated participant table found
- no dedicated commercial meeting-outcome table found

Required:

- Participants and roles
- Attendance/no-show evidence
- Agenda and objectives
- Notes and decisions
- Commitments
- Objections
- Action items
- Outcome classification
- Conversion consequence
- Follow-up generation

### 5.8 Follow-ups and communications

The source includes a follow-up API and route family, but no dedicated `revenue_follow_ups` table was found in the migration corpus. No dedicated communication-event table was found for email, WhatsApp, phone or meeting communication truth.

Required:

- Follow-up record with due date, owner and state
- Waiting-for-external-response state
- Channel
- Message/call metadata
- Outcome
- Retry and escalation
- Prospect/account/opportunity relation
- Gmail/WhatsApp/phone adapter reference
- Consent and communication-policy fields where required

### 5.9 Campaign execution depth

Found:

- `revenue_os_campaigns`
- campaign patterns, waves and propagations
- Revenue Command Center campaign API

Missing or not exposed as dedicated command workflows:

- Campaign audience/recipient membership
- Assets and versions
- Touch/cadence steps
- Channel delivery events
- Replies and outcomes
- Attribution to opportunity and revenue
- Suppression and opt-out
- Experiment variants
- Budget/cost and ROI

### 5.10 Partnership lifecycle depth

Found:

- `revenue_partnerships`
- `revenue_partnership_activities`
- `revenue_partnership_programs`
- Revenue OS partner benefits, referral paths and renewal paths

Required UI/API bridge depth:

- Partner contacts and decision map
- Program enrollment
- Benefit activation
- Referral cases and attribution
- Agreement and contract gates
- Partner obligations
- Performance periods
- Risk and recovery
- Renewal/expansion
- Revenue attribution

### 5.11 Approvals and governance

Multiple Revenue OS approval tables exist, while the Command Center also references `revenue_command_approvals`. A canonical approval boundary is required so the UI does not create competing approval systems.

The audit must define:

- Which approvals remain Command Center operational approvals
- Which approvals belong to Revenue OS strategy/execution governance
- Which commercial approvals belong to pricing, legal, finance or executive authority
- How approval evidence is surfaced without duplicating records

---

## 6. Route-family frontend rebuild sequence

### Mega Phase A — Workspace Sovereignty

- Global full-width shell
- Uniform collapsible/extractable sidebar
- Route search and active-state logic
- Shared responsive behavior
- No duplicate primary sidebars
- Modal and drawer foundation

### Mega Phase B — Prospects, accounts and opportunities

- Acquisition command
- Directory
- Full dossier
- Qualification
- Decision map
- Opportunity pipeline
- Proposal and negotiation
- Recovery and risk
- Every modal and quick action

### Mega Phase C — Tasks, daily execution and approvals

- My work
- Daily desk
- Task board/list/calendar
- New task studio
- Task dossier
- Blockers
- Approvals
- Workload and team performance

### Mega Phase D — Appointments and meeting conversion

- Calendar and queue
- Briefing
- Live meeting
- Outcome
- Follow-up
- No-show and reschedule
- Conversion, risk and recovery
- High-value/executive control

### Mega Phase E — Partnerships

- Executive network cockpit
- Directory and dossier
- Programs
- Qualification
- Decision map
- Meeting
- Proposal/agreement
- Activation
- Referrals
- Performance
- Growth, renewal and recovery

### Mega Phase F — B2C commercial lifecycle

- Intake
- Qualification
- Consultation
- Quote
- Matching
- Onboarding
- Care start
- Active clients
- Retention and recovery
- Risk and executive views

### Mega Phase G — Campaigns, SDR and market development

- Campaign studio
- Assets
- Audience
- Execution
- Cadence
- Replies
- Attribution
- SDR daily command
- Market mapping and business development

### Mega Phase H — Executive intelligence and orchestration

- Revenue analytics
- Activity chronology
- Predictive/scoring
- Control tower
- Executive briefing
- Strategy Room
- Automation/system activation
- Master/Elite command

---

## 7. Modal sovereignty rules

Every existing modal must be classified and rebuilt under one of four patterns:

1. **Quick action popover/modal** — one decision, minimal fields.
2. **Right-side dossier drawer** — inspect/edit without losing list context.
3. **Centered enterprise modal** — focused multi-section action, never full browser width.
4. **Full-page studio** — proposal, negotiation, account plan, meeting execution or other complex work.

Mandatory behavior:

- Accessible title and description
- Focus management
- Escape handling where safe
- Sticky action footer for long forms
- Dirty-state confirmation
- Destructive-action separation
- Responsive mobile transformation
- No hidden action rail
- No unbounded `max-w-[1900px]` modal presented as a dialog
- No fake save or unsupported action

---

## 8. Safety boundary

The full-cycle gap register is an audit and future additive build plan. It does not authorize immediate database mutation.

Before any schema/API completion patch:

- Inspect the live Supabase schema
- Confirm existing columns, constraints, views, RLS and functions
- Reuse existing tables whenever possible
- Introduce only additive migrations
- Preserve historical records and IDs
- Preserve Browser OS contracts
- Preserve Revenue OS command/strategy/execution boundaries
- Preserve Gmail, WhatsApp, Calendar, payment and external-adapter wiring
- Provide rollback and preflight SQL

---

## 9. Current acceptance position

**Workspace Sovereignty Foundation:** implemented in Excellence v2 incremental patch.
**All 151 route-specific premium rebuilds:** not yet claimed complete.
**All modal rebuilds:** not yet claimed complete.
**Backend full-cycle completion:** audited at source level; live schema verification and separate additive implementation contract still required.

The current patch deliberately fixes the first structural defect without pretending that the entire route estate has already received individual enterprise reconstruction.
