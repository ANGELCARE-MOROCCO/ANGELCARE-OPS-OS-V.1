# ANGELCARE Revenue Command Center
## Excellence v6 — Proposal Studio, Pricing, Margin Protection & Negotiation Command

**Implementation date:** 25 July 2026
**Delivery mode:** cumulative over Excellence v1–v5
**Production identity contract:** `revenue_prospects.id = text` remains unchanged
**Default presentation:** French (`fr-FR`), values shown in **Dh**

## 1. Executive result

Mega ZIP 6 establishes the governed commercial-offer layer between meeting conversion and contract execution:

**Qualified outcome → proposal → services → pricing → margin control → approval → immutable version → customer preview → transmission → response → objection → counteroffer → concession → negotiated decision → contract-ready handoff.**

The delivery does not create legal contracts, signatures, payment schedules, invoices, or finance records. Those remain the controlled scope of Mega ZIP 7.

## 2. Route completion

The cumulative repository contains exactly **151 Revenue Command Center page routes**. The live source audit identified **8 existing proposal, negotiation, partnership-offer and B2C-quote routes**. All 8 have been individually delegated to purpose-built Enterprise v6 experiences:

- Proposal Command Center
- Proposal dossier and full Proposal Studio
- Negotiation Command Center
- Full Negotiation Room
- Partnership offer portfolio
- Partnership proposal studio
- B2C quotation command
- B2C quotation studio

No new public route was invented and no bookmarked route was renamed.

## 3. Frontend experience

The v6 interface adds:

- Full-width corporate proposal command
- Three-zone Proposal Studio
- Pricing and margin-protection laboratory
- Approval and exception desk
- Immutable version history
- Customer-facing preview that excludes internal costs, margins, private notes and approval details
- Truthful transmission and recipient-event controls
- Negotiation position comparison
- Objection and counteroffer control
- Concession governance
- Contract-readiness display
- Responsive tablet and mobile transformations
- Loading, empty, error, schema-unavailable and mutation states

A collapsible **38-operation commercial action library** makes every contracted proposal and negotiation sub-experience accessible without flattening the pages into one generic modal.

## 4. Modal and sub-experience completion

The signed 38-operation contract is represented through:

- Transactional enterprise modals
- Dedicated customer-preview and comparison viewers
- Approval, evidence and audit viewers
- Full-page Proposal Studio and Negotiation Room
- Controlled destructive and final-outcome forms

All dialogs include focus trapping, Escape handling, focus restoration, background-scroll protection, responsive transformation, controlled errors and no false success before API confirmation.

## 5. API completion

A new protected family under `/api/revenue-command-center/proposal` contains **29 route files**. It covers:

- Portfolio and related commercial data
- Proposal collection and dossier mutation
- Controlled status transitions
- Sections and line items
- Pricing preview and persisted scenarios
- Discounts and margin exceptions
- Proposal, pricing and concession approvals
- Immutable versions and comparison
- Document snapshots
- Recipient preparation, transmissions and delivery events
- Customer responses
- Negotiations, positions and rounds
- Objections and resolution
- Counteroffers
- Concessions and decisions
- Final commercial outcomes
- A governed command dispatcher for the complete 38-operation frontend contract

Every endpoint resolves authenticated Revenue access before using the protected command path. External delivery, opening or acceptance is never fabricated.

## 6. Data model

The additive migration introduces **23 operational tables**:

1. `revenue_proposals`
2. `revenue_proposal_versions`
3. `revenue_proposal_sections`
4. `revenue_proposal_line_items`
5. `revenue_pricing_scenarios`
6. `revenue_proposal_approval_requests`
7. `revenue_discount_requests`
8. `revenue_margin_exceptions`
9. `revenue_proposal_documents`
10. `revenue_proposal_recipients`
11. `revenue_proposal_transmissions`
12. `revenue_proposal_delivery_events`
13. `revenue_proposal_responses`
14. `revenue_negotiations`
15. `revenue_negotiation_rounds`
16. `revenue_negotiation_positions`
17. `revenue_proposal_objections`
18. `revenue_counteroffers`
19. `revenue_concession_requests`
20. `revenue_negotiation_decisions`
21. `revenue_proposal_status_history`
22. `revenue_commercial_outcomes`
23. `revenue_contract_handoffs`

It also introduces:

- `revenue_proposal_command_view`
- `revenue_negotiation_command_view`
- `revenue_recalculate_proposal(uuid)`
- `revenue_create_proposal_version(uuid,text,text,text,uuid)`
- `revenue_apply_commercial_outcome(uuid,jsonb,uuid)`

## 7. Financial integrity

The server and database preserve the canonical formulas:

- Net commercial value = gross value − discount
- Expected gross margin = net value − estimated internal cost
- Margin percentage = expected gross margin ÷ net value, with safe zero-value handling

The final acceptance command rejects acceptance when:

- No immutable active version exists
- The proposal is not approved
- The final value is not positive
- Accepted terms are missing
- Verifiable acceptance evidence is missing
- An approval remains pending
- Final margin is below threshold without an approved exception
- A concession remains pending
- Final discount exceeds gross proposal value

The command is idempotent once the accepted version has produced a contract handoff.

## 8. Version and customer-data protection

- Approved or sent proposal versions remain immutable snapshots.
- Internal costs and margins are separate from recipient-visible data.
- The customer preview excludes internal notes, internal-only lines and governance details.
- Final acceptance identifies the exact active version.
- A contract-ready record is linked to the commercial outcome and accepted version.

## 9. Contract-ready handoff

An accepted outcome atomically:

1. Locks the proposal.
2. Validates approval, value, margin, concession and evidence gates.
3. Records the commercial outcome.
4. Updates the proposal to `contract_ready`.
5. Closes the negotiation as agreement reached when applicable.
6. Creates the contract handoff.
7. Creates a critical contract-preparation task in the Mega ZIP 4 execution engine.

## 10. Migration safety

The read-only preflight verifies:

- Phase 2 account/contact/opportunity foundation
- Phase 4 task foundation
- Phase 5 appointment, meeting outcome and communication foundation
- The accepted TEXT prospect identity contract
- Absence of a partially installed v6 schema
- UUID identities for new proposal objects when already present

The migration refuses to continue against a partial or incompatible proposal schema. It is additive, transactional, RLS-enabled and reversible through the supplied controlled rollback.

## 11. Verification results

The cumulative offline acceptance run passed:

- **113** global Revenue UI/UX checks
- **258** Prospect / Account / Opportunity checks
- **193** Tasks / Approvals / Accountability checks
- **296** Communications / Appointments / Meetings checks
- **291** Proposal / Pricing / Negotiation checks
- **151/151** Revenue routes preserved
- **29/29** proposal API route files present
- Isolated strict UI TypeScript check: passed
- Isolated strict server TypeScript check: passed
- Isolated strict API TypeScript check: passed
- TypeScript syntax diagnostics: zero
- CSS-module references: zero missing

A live Supabase migration, authenticated end-to-end customer transaction and Vercel production build are intentionally not claimed from the offline source environment.

## 12. Required production activation

1. Confirm a current Supabase backup.
2. Run the read-only v6 preflight.
3. Continue only when `CUTOVER_GATE = READY`.
4. Apply the v6 migration.
5. Run RLS/object verification.
6. Run calculation verification.
7. Redeploy the cumulative application patch.
8. Execute the authenticated proposal-to-contract-ready smoke scenario.

## 13. Honest boundary

Mega ZIP 6 finishes the governed commercial position. It does not represent final contract, signature, payment, finance or service activation completion. The resulting contract handoff is the authoritative input for Mega ZIP 7.
