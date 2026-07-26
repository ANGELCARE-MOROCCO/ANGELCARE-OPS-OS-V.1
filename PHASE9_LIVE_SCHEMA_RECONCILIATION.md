# Phase 9 Live Schema Reconciliation

## Authoritative boundaries

- `public.revenue_prospects.id` remains `text`.
- `public.revenue_b2c_cases.id` must be UUID.
- Phase 6 owns quotations and pricing.
- Phase 7 owns contracts, authoritative payment gates, operational handoffs and revenue realization.
- Caregiver/agent identity and availability remain authoritative in existing operational systems.
- Phase 9 adds B2C workflow evidence and control, not duplicate ledgers.

## Additive objects

### Tables (24)
- `revenue_b2c_guardians`
- `revenue_b2c_beneficiaries`
- `revenue_b2c_emergency_contacts`
- `revenue_b2c_family_instructions`
- `revenue_b2c_service_requirements`
- `revenue_b2c_needs_assessments`
- `revenue_b2c_consultations`
- `revenue_b2c_service_recommendations`
- `revenue_b2c_matching_cycles`
- `revenue_b2c_matching_candidates`
- `revenue_b2c_matching_decisions`
- `revenue_b2c_onboarding_plans`
- `revenue_b2c_onboarding_items`
- `revenue_b2c_activation_gates`
- `revenue_b2c_care_starts`
- `revenue_b2c_satisfaction_checks`
- `revenue_b2c_complaints`
- `revenue_b2c_retention_risks`
- `revenue_b2c_retention_plans`
- `revenue_b2c_recovery_plans`
- `revenue_b2c_recovery_checkpoints`
- `revenue_b2c_status_history`
- `revenue_b2c_evidence`
- `revenue_b2c_closures`

### Views
- `revenue_b2c_command_view`
- `revenue_b2c_matching_command_view`
- `revenue_b2c_retention_command_view`

### Atomic commands
- `revenue_accept_b2c_match`
- `revenue_evaluate_b2c_activation`
- `revenue_authorize_b2c_activation`

## Cutover rule

Run `20260725_b2c_family_matching_retention_live_schema_preflight.sql`. Proceed only when `CUTOVER_GATE = READY`. A `BLOCKED` result requires reconciliation; do not edit around the gate or create tables manually.

## Privacy and integrity

Beneficiary data is minimized, RLS-protected and linked only to legitimate service workflows. Matching requires verified availability. Activation requires authoritative contract, payment and handoff evidence.
